const { ethers, deployments, network, tasks } = require("hardhat");
const { expect } = require("chai");

const gelatoDiamondAddress = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";

describe("TaskStore Test", async function () {
  let taskStore;
  let increment;
  let gelatoDiamond;

  this.timeout(0);

  beforeEach(async function () {
    [user, sponsor] = await hre.ethers.getSigners();
    userAddress = await user.getAddress();
    sponsorAddress = await sponsor.getAddress();

    _taskStore = await ethers.getContractFactory("TaskStore");
    _increment = await ethers.getContractFactory("Increment");

    taskStore = await _taskStore.deploy(
      ethers.utils.parseEther("1"),
      gelatoDiamondAddress
    );
    increment = await _increment.deploy();
    gelatoDiamond = await ethers.getContractAt("IGelato", gelatoDiamondAddress);

    executorAddress = (await gelatoDiamond.executors())[0];
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [executorAddress],
    });
    executor = await ethers.provider.getSigner(executorAddress);

    taskData = await increment.interface.encodeFunctionData("increment", [4]);
    await expect(
      taskStore.connect(user).createTask(increment.address, taskData)
    )
      .to.emit(taskStore, "TaskCreated")
      .withArgs(increment.address, taskData);
  });

  it("check create and cancel task", async () => {
    await expect(
      taskStore.connect(user).createTask(increment.address, taskData)
    ).to.be.revertedWith("TaskStore: createTask: Sender already started task");

    await taskStore.connect(user).cancelTask(increment.address, taskData);

    await expect(
      taskStore.connect(user).cancelTask(increment.address, taskData)
    ).to.be.revertedWith(
      "TaskStore: cancelTask: Sender did not start task yet"
    );
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

  it("canExec should return false, executor should not exec", async () => {
    const [canExec, callee, data] = await increment
      .connect(executor)
      .callStatic.canExec(taskData);
    expect(canExec).to.be.eql(false);
  });

  it("reverts if not executor", async () => {
    await increment.toggleAllowExec();

    await expect(
      taskStore.connect(user).exec(increment.address, taskData)
    ).to.be.revertedWith("TaskStore: exec: Only executors");
  });

  it("canExec should return true, executor should not exec if no sponsors", async () => {
    await increment.toggleAllowExec();

    const [canExec, callee, data] = await increment
      .connect(executor)
      .callStatic.canExec(taskData);
    expect(canExec).to.be.eql(true);

    await expect(
      taskStore.connect(executor).exec(increment.address, taskData)
    ).to.be.revertedWith("TaskStore: exec: No sponsor");

    expect(Number(await increment.counter())).to.be.eql(0);
  });

  it("canExec should return true, executor should not exec if sponsor has insufficient balance", async () => {
    await increment.toggleAllowExec();
    await taskStore
      .connect(sponsor)
      .depositFunds({ value: ethers.utils.parseEther("1") });
    expect(await taskStore.balanceOfSponsor(sponsorAddress)).to.be.eql(
      ethers.utils.parseEther("1")
    );
    await taskStore.connect(sponsor).whitelistCallee(await increment.owner());
    await taskStore
      .connect(sponsor)
      .withdrawFunds(ethers.utils.parseEther("1"));
    expect(await taskStore.balanceOfSponsor(sponsorAddress)).to.be.eql(
      ethers.BigNumber.from("0")
    );

    const [canExec, callee, data] = await increment
      .connect(executor)
      .callStatic.canExec(taskData);
    expect(canExec).to.be.eql(true);

    await expect(
      taskStore.connect(executor).exec(increment.address, taskData)
    ).to.be.revertedWith("TaskStore: exec: Sponsor insufficient balance");

    expect(Number(await increment.counter())).to.be.eql(0);
  });

  it("canExec should return true, executor should exec", async () => {
    await increment.toggleAllowExec();
    await taskStore
      .connect(sponsor)
      .depositFunds({ value: ethers.utils.parseEther("1") });
    expect(await taskStore.balanceOfSponsor(sponsorAddress)).to.be.eql(
      ethers.utils.parseEther("1")
    );
    await taskStore.connect(sponsor).whitelistCallee(await increment.owner());

    const executorETH_before = await ethers.provider.getBalance(
      executorAddress
    );
    console.log("ETH before: ", ethers.utils.formatEther(executorETH_before));

    const [canExec, callee, data] = await increment
      .connect(executor)
      .callStatic.canExec(taskData);
    expect(canExec).to.be.eql(true);

    await taskStore.connect(executor).exec(increment.address, taskData);

    expect(Number(await increment.counter())).to.be.eql(4);

    expect(await taskStore.balanceOfSponsor(sponsorAddress)).to.be.eql(
      ethers.BigNumber.from("0")
    );

    const executorETH_after = await ethers.provider.getBalance(executorAddress);
    console.log("ETH after: ", ethers.utils.formatEther(executorETH_after));

    expect(executorETH_after).to.be.gt(executorETH_before);
  });
});
