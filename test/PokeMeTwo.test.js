const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const gelatoAddress = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";

describe("PokeMeTwo Test", function () {
  let pokeMe;
  let counter;
  let user;
  let userAddress;
  let executorAddress;
  let counterResolver;
  let resolverData;
  let executor;
  let execData;
  let res;
  let taskHash;
  let selector;
  let _pokeMe;
  let _counter;
  let _counterResolver;

  beforeEach(async function () {
    [user] = await ethers.getSigners();
    userAddress = await user.getAddress();

    _pokeMe = await ethers.getContractFactory("PokeMe2");
    _counter = await ethers.getContractFactory("Counter");
    _counterResolver = await ethers.getContractFactory("CounterResolver");

    pokeMe = await _pokeMe.deploy(gelatoAddress);
    counter = await _counter.deploy();
    counterResolver = await _counterResolver.deploy(counter.address);

    executorAddress = gelatoAddress;

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [executorAddress],
    });
    executor = await ethers.provider.getSigner(executorAddress);

    resolverData = await counterResolver.interface.encodeFunctionData(
      "canExecGetPayload",
      []
    );

    selector = counter.interface.getSighash("increaseCount");

    await expect(
      pokeMe
        .connect(user)
        .createTask(
          counter.address,
          selector,
          counterResolver.address,
          resolverData
        )
    )
      .to.emit(pokeMe, "TaskCreated")
      .withArgs(
        counter.address,
        selector,
        counterResolver.address,
        resolverData
      );

    taskHash = await pokeMe.getTaskHash(counter.address, selector);
  });

  it("check create and cancel task", async () => {
    await pokeMe.connect(user).cancelTask(taskHash);

    await expect(pokeMe.connect(user).cancelTask(taskHash)).to.be.revertedWith(
      "PokeMe: cancelTask: Sender did not start task yet"
    );
  });

  it("deposit and withdraw funds", async () => {
    await pokeMe
      .connect(user)
      .depositFunds(userAddress, { value: ethers.utils.parseEther("1") });

    expect(await pokeMe.balanceOfCallee(userAddress)).to.be.eql(
      ethers.utils.parseEther("1")
    );

    await pokeMe.connect(user).withdrawFunds(ethers.utils.parseEther("1"));

    expect(await pokeMe.balanceOfCallee(userAddress)).to.be.eq(
      ethers.BigNumber.from("0")
    );
  });

  it("canExec should be true, caller does not have balance", async () => {
    const THREE_MIN = 3 * 60;
    const time_before = (await ethers.provider.getBlock()).timestamp;

    await network.provider.send("evm_increaseTime", [THREE_MIN]);
    await network.provider.send("evm_mine", []);

    const time_after = (await ethers.provider.getBlock()).timestamp;

    // expect(time_after - time_before).to.be.eq(THREE_MIN);

    const payload = await ethers.provider.call({
      to: counterResolver.address,
      data: resolverData,
    });

    // genPayloadAndCanExec must return
    //   bool _canExec
    //   bytes memory _execData,
    const iface = new ethers.utils.Interface([
      "function canExec() public view returns(bool canExec, bytes execData)",
    ]);

    res = iface.decodeFunctionResult("canExec", payload);

    execData = res.execData;

    await expect(
      pokeMe
        .connect(executor)
        .exec(ethers.utils.parseEther("1"), counter.address, execData)
    ).to.be.reverted;
  });

  it("canExec should be true, executor should exec", async () => {
    const THREE_MIN = 3 * 60;
    const time_before = (await ethers.provider.getBlock()).timestamp;

    await network.provider.send("evm_increaseTime", [THREE_MIN]);
    await network.provider.send("evm_mine", []);

    const time_after = (await ethers.provider.getBlock()).timestamp;

    expect(time_after - time_before).to.be.eq(THREE_MIN);

    expect(await counter.count()).to.be.eq(ethers.BigNumber.from("0"));

    await pokeMe
      .connect(user)
      .depositFunds(userAddress, { value: ethers.utils.parseEther("1") });

    expect(await pokeMe.connect(user).balanceOfCallee(userAddress)).to.be.eql(
      ethers.utils.parseEther("1")
    );

    await pokeMe
      .connect(executor)
      .exec(ethers.utils.parseEther("1"), counter.address, execData);

    expect(await counter.count()).to.be.eq(ethers.BigNumber.from("100"));
    expect(await pokeMe.connect(user).balanceOfCallee(userAddress)).to.be.eq(
      ethers.BigNumber.from("0")
    );

    // time not elapsed
    await expect(
      pokeMe
        .connect(executor)
        .exec(ethers.utils.parseEther("1"), counter.address, execData)
    ).to.be.revertedWith("PokeMe: exec: Execution failed");
  });
});
