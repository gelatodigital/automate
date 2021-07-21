const { ethers, network, tasks } = require("hardhat");
const { expect } = require("chai");

const gelatoDiamondAddress = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const generalGenPayload =
  " function generalGenPayload() external view returns (address _execAddress, bytes memory _execData, bool _canExec)";

describe("PokeMe Test", async function () {
  let taskStore;
  let counter;
  let resolver;
  let gelatoDiamond;

  this.timeout(0);

  beforeEach(async function () {
    [user, sponsor] = await hre.ethers.getSigners();
    userAddress = await user.getAddress();
    sponsorAddress = await sponsor.getAddress();

    _taskStore = await ethers.getContractFactory("PokeMe");
    _counter = await ethers.getContractFactory("Counter");
    _resolver = await ethers.getContractFactory("Resolver");

    taskStore = await _taskStore.deploy(
      ethers.utils.parseEther("1"),
      gelatoDiamondAddress
    );
    counter = await _counter.deploy();
    resolver = await _resolver.deploy(counter.address);
    gelatoDiamond = await ethers.getContractAt("IGelato", gelatoDiamondAddress);

    executorAddress = (await gelatoDiamond.executors())[0];

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [executorAddress],
    });
    executor = await ethers.provider.getSigner(executorAddress);

    taskData = await resolver.interface.encodeFunctionData(
      "genPayloadAndCanExec",
      [3]
    );
    await expect(taskStore.connect(user).createTask(resolver.address, taskData))
      .to.emit(taskStore, "TaskCreated")
      .withArgs(resolver.address, taskData);
  });

  it("check create and cancel task", async () => {
    await expect(
      taskStore.connect(user).createTask(resolver.address, taskData)
    ).to.be.revertedWith("PokeMe: createTask: Sender already started task");

    await taskStore.connect(user).cancelTask(resolver.address, taskData);

    await expect(
      taskStore.connect(user).cancelTask(resolver.address, taskData)
    ).to.be.revertedWith("PokeMe: cancelTask: Sender did not start task yet");
  });

  it("deposit and withdraw funds", async () => {
    await taskStore
      .connect(sponsor)
      .depositFunds({ value: ethers.utils.parseEther("1") });

    expect(await taskStore.balanceOfSponsor(sponsorAddress)).to.be.eql(
      ethers.utils.parseEther("1")
    );

    await taskStore
      .connect(sponsor)
      .withdrawFunds(ethers.utils.parseEther("1"));

    expect(await taskStore.balanceOfSponsor(sponsorAddress)).to.be.eql(
      ethers.BigNumber.from("0")
    );
  });

  it("get payload from task", async () => {
    const iface = new ethers.utils.Interface([generalGenPayload]);

    const payload = await ethers.provider.call({
      to: resolver.address,
      data: taskData,
    });

    // genPayloadAndCanExec must return
    //   address _execAddress,
    //   bytes memory _execData,
    //   bool _canExec

    res = iface.decodeFunctionResult("generalGenPayload", payload);

    const execAddress = res._execAddress;
    const execData = res._execData;
    const canExec = res._canExec;

    expect(execAddress).to.be.eql(counter.address);
    expect(canExec).to.be.eql(false);
  });

  it("canExec should be true, unhappy paths", async () => {
    const FIVE_MIN = 5 * 60;
    const time_before = (await ethers.provider.getBlock()).timestamp;

    await network.provider.send("evm_increaseTime", [FIVE_MIN]);
    await network.provider.send("evm_mine", []);

    const time_after = (await ethers.provider.getBlock()).timestamp;

    expect(time_after - time_before).to.be.eql(FIVE_MIN);

    const iface = new ethers.utils.Interface([generalGenPayload]);

    const payload = await ethers.provider.call({
      to: resolver.address,
      data: taskData,
    });

    res = iface.decodeFunctionResult("generalGenPayload", payload);

    execAddress = res._execAddress;
    execData = res._execData;
    canExec = res._canExec;

    expect(execAddress).to.be.eql(counter.address);
    expect(canExec).to.be.eql(true);

    await expect(
      taskStore
        .connect(executor)
        .exec(resolver.address, taskData, execAddress, execData)
    ).to.be.revertedWith("PokeMe: exec: No sponsor");

    await expect(
      taskStore.connect(sponsor).whitelistCallee(userAddress)
    ).to.be.revertedWith(
      "PokeMe: whitelistCallee: Sponsor does not have balance"
    );

    await taskStore
      .connect(sponsor)
      .depositFunds({ value: ethers.utils.parseEther("1") });

    await taskStore.connect(sponsor).whitelistCallee(userAddress);

    await taskStore
      .connect(sponsor)
      .withdrawFunds(ethers.utils.parseEther("1"));

    await expect(
      taskStore
        .connect(executor)
        .exec(resolver.address, taskData, execAddress, execData)
    ).to.be.revertedWith("PokeMe: exec: Sponsor insufficient");
  });

  it("canExec should be true, executor should exec", async () => {
    const FIVE_MIN = 5 * 60;
    const time_before = (await ethers.provider.getBlock()).timestamp;

    await network.provider.send("evm_increaseTime", [FIVE_MIN]);
    await network.provider.send("evm_mine", []);

    const time_after = (await ethers.provider.getBlock()).timestamp;

    expect(time_after - time_before).to.be.eql(FIVE_MIN);

    const iface = new ethers.utils.Interface([generalGenPayload]);

    const payload = await ethers.provider.call({
      to: resolver.address,
      data: taskData,
    });

    res = iface.decodeFunctionResult("generalGenPayload", payload);

    execAddress = res._execAddress;
    execData = res._execData;
    canExec = res._canExec;

    expect(execAddress).to.be.eql(counter.address);
    expect(canExec).to.be.eql(true);

    expect(await counter.count()).to.be.eql(ethers.BigNumber.from("0"));

    await taskStore
      .connect(sponsor)
      .depositFunds({ value: ethers.utils.parseEther("1") });

    expect(
      await taskStore.connect(sponsor).balanceOfSponsor(sponsorAddress)
    ).to.be.eql(ethers.utils.parseEther("1"));

    await taskStore.connect(sponsor).whitelistCallee(userAddress);

    await taskStore
      .connect(executor)
      .exec(resolver.address, taskData, execAddress, execData);

    expect(await counter.count()).to.be.eql(ethers.BigNumber.from("3"));
    expect(
      await taskStore.connect(sponsor).balanceOfSponsor(sponsorAddress)
    ).to.be.eql(ethers.BigNumber.from("0"));
  });
});
