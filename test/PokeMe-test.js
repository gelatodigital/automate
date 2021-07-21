const { ethers, network, tasks } = require("hardhat");
const { expect } = require("chai");

const gelatoDiamondAddress = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const generalGenPayload =
  " function generalGenPayload() external view returns (bytes memory _execData)";

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

    taskStore = await _taskStore.deploy(gelatoDiamondAddress);
    counter = await _counter.deploy();
    resolver = await _resolver.deploy();

    executorAddress = gelatoDiamondAddress;

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [executorAddress],
    });
    executor = await ethers.provider.getSigner(executorAddress);

    taskData = await resolver.interface.encodeFunctionData(
      "genPayloadAndCanExec",
      [3]
    );
    await expect(
      taskStore
        .connect(user)
        .createTask(resolver.address, taskData, counter.address)
    )
      .to.emit(taskStore, "TaskCreated")
      .withArgs(resolver.address, taskData, counter.address);
  });

  it("check create and cancel task", async () => {
    await expect(
      taskStore
        .connect(user)
        .createTask(resolver.address, taskData, counter.address)
    ).to.be.revertedWith("PokeMe: createTask: Sender already started task");

    await taskStore
      .connect(user)
      .cancelTask(resolver.address, taskData, counter.address);

    await expect(
      taskStore
        .connect(user)
        .cancelTask(resolver.address, taskData, counter.address)
    ).to.be.revertedWith("PokeMe: cancelTask: Sender did not start task yet");
  });

  it("deposit and withdraw funds", async () => {
    await taskStore
      .connect(user)
      .depositFunds({ value: ethers.utils.parseEther("1") });

    expect(await taskStore.balanceOfCallee(userAddress)).to.be.eql(
      ethers.utils.parseEther("1")
    );

    await taskStore.connect(user).withdrawFunds(ethers.utils.parseEther("1"));

    expect(await taskStore.balanceOfCallee(userAddress)).to.be.eql(
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

    const execData = res._execData;

    console.log(execData);
  });

  it("canExec should be true, caller does not have balance", async () => {
    const THREE_MIN = 3 * 60;
    const time_before = (await ethers.provider.getBlock()).timestamp;

    await network.provider.send("evm_increaseTime", [THREE_MIN]);
    await network.provider.send("evm_mine", []);

    const time_after = (await ethers.provider.getBlock()).timestamp;

    expect(time_after - time_before).to.be.eql(THREE_MIN);

    const iface = new ethers.utils.Interface([generalGenPayload]);

    const payload = await ethers.provider.call({
      to: resolver.address,
      data: taskData,
    });

    res = iface.decodeFunctionResult("generalGenPayload", payload);

    const execData = res._execData;

    await expect(
      taskStore
        .connect(executor)
        .exec(
          resolver.address,
          taskData,
          counter.address,
          execData,
          ethers.utils.parseEther("1")
        )
    ).to.be.reverted;
  });

  it("canExec should be true, executor should exec", async () => {
    const THREE_MIN = 3 * 60;
    const time_before = (await ethers.provider.getBlock()).timestamp;

    await network.provider.send("evm_increaseTime", [THREE_MIN]);
    await network.provider.send("evm_mine", []);

    const time_after = (await ethers.provider.getBlock()).timestamp;

    expect(time_after - time_before).to.be.eql(THREE_MIN);

    const iface = new ethers.utils.Interface([generalGenPayload]);

    const payload = await ethers.provider.call({
      to: resolver.address,
      data: taskData,
    });

    res = iface.decodeFunctionResult("generalGenPayload", payload);

    const execData = res._execData;

    expect(await counter.count()).to.be.eql(ethers.BigNumber.from("0"));

    await taskStore
      .connect(user)
      .depositFunds({ value: ethers.utils.parseEther("1") });

    expect(
      await taskStore.connect(user).balanceOfCallee(userAddress)
    ).to.be.eql(ethers.utils.parseEther("1"));

    await taskStore
      .connect(executor)
      .exec(
        resolver.address,
        taskData,
        counter.address,
        execData,
        ethers.utils.parseEther("1")
      );

    expect(await counter.count()).to.be.eql(ethers.BigNumber.from("3"));
    expect(
      await taskStore.connect(user).balanceOfCallee(userAddress)
    ).to.be.eql(ethers.BigNumber.from("0"));

    // time not elapsed
    await expect(
      taskStore
        .connect(executor)
        .exec(
          resolver.address,
          taskData,
          counter.address,
          execData,
          ethers.utils.parseEther("1")
        )
    ).to.be.revertedWith("PokeMe: exec: Execution failed");
  });
});
