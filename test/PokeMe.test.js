const { ethers, network } = require("hardhat");
const { expect } = require("chai");

const gelatoAddress = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";

describe("PokeMe Test", async function () {
  let pokeMe;
  let counter;

  this.timeout(0);

  beforeEach(async function () {
    [user, sponsor] = await hre.ethers.getSigners();
    userAddress = await user.getAddress();
    sponsorAddress = await sponsor.getAddress();

    _pokeMe = await ethers.getContractFactory("PokeMe");
    _counter = await ethers.getContractFactory("Counter");

    pokeMe = await _pokeMe.deploy(gelatoAddress);
    counter = await _counter.deploy();

    executorAddress = gelatoAddress;

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [executorAddress],
    });
    executor = await ethers.provider.getSigner(executorAddress);

    taskData = await counter.interface.encodeFunctionData("increaseCount", [3]);

    await expect(pokeMe.connect(user).createTask(counter.address, taskData))
      .to.emit(pokeMe, "TaskCreated")
      .withArgs(counter.address, taskData);
  });

  it("check create and cancel task", async () => {
    await expect(
      pokeMe.connect(user).createTask(counter.address, taskData)
    ).to.be.revertedWith("PokeMe: createTask: Sender already started task");

    await pokeMe.connect(user).cancelTask(counter.address, taskData);

    await expect(
      pokeMe.connect(user).cancelTask(counter.address, taskData)
    ).to.be.revertedWith("PokeMe: cancelTask: Sender did not start task yet");
  });

  it("deposit and withdraw funds", async () => {
    await pokeMe
      .connect(user)
      .depositFunds(userAddress, { value: ethers.utils.parseEther("1") });

    expect(await pokeMe.balanceOfCallee(userAddress)).to.be.eql(
      ethers.utils.parseEther("1")
    );

    await pokeMe.connect(user).withdrawFunds(ethers.utils.parseEther("1"));

    expect(await pokeMe.balanceOfCallee(userAddress)).to.be.eql(
      ethers.BigNumber.from("0")
    );
  });

  it("canExec should be true, caller does not have balance", async () => {
    const THREE_MIN = 3 * 60;
    const time_before = (await ethers.provider.getBlock()).timestamp;

    await network.provider.send("evm_increaseTime", [THREE_MIN]);
    await network.provider.send("evm_mine", []);

    const time_after = (await ethers.provider.getBlock()).timestamp;

    expect(time_after - time_before).to.be.eql(THREE_MIN);

    await expect(
      pokeMe
        .connect(executor)
        .exec(ethers.utils.parseEther("1"), counter.address, taskData)
    ).to.be.reverted;
  });

  it("canExec should be true, executor should exec", async () => {
    const THREE_MIN = 3 * 60;
    const time_before = (await ethers.provider.getBlock()).timestamp;

    await network.provider.send("evm_increaseTime", [THREE_MIN]);
    await network.provider.send("evm_mine", []);

    const time_after = (await ethers.provider.getBlock()).timestamp;

    expect(time_after - time_before).to.be.eql(THREE_MIN);

    expect(await counter.count()).to.be.eql(ethers.BigNumber.from("0"));

    await pokeMe
      .connect(user)
      .depositFunds(userAddress, { value: ethers.utils.parseEther("1") });

    expect(await pokeMe.connect(user).balanceOfCallee(userAddress)).to.be.eql(
      ethers.utils.parseEther("1")
    );

    await pokeMe
      .connect(executor)
      .exec(ethers.utils.parseEther("1"), counter.address, taskData);

    expect(await counter.count()).to.be.eql(ethers.BigNumber.from("3"));
    expect(await pokeMe.connect(user).balanceOfCallee(userAddress)).to.be.eql(
      ethers.BigNumber.from("0")
    );

    // time not elapsed
    await expect(
      pokeMe
        .connect(executor)
        .exec(ethers.utils.parseEther("1"), counter.address, taskData)
    ).to.be.revertedWith("PokeMe: exec: Execution failed");
  });
});
