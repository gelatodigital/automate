const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { getTokenFromFaucet } = require("./helpers.js");

const gelatoAddress = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";

describe("PokeMeTwo Test", function () {
  let pokeMe;
  let counter;
  let user;
  let userAddress;
  let user2;
  let user2Address;
  let executorAddress;
  let counterResolver;
  let resolverData;
  let executor;
  let execData;
  let taskId;
  let taskHash;
  let selector;
  let _pokeMe;
  let _counter;
  let _counterResolver;
  let _taskTreasury;
  let taskTreasury;
  let dai;

  beforeEach(async function () {
    [user, user2] = await ethers.getSigners();
    userAddress = await user.getAddress();
    user2Address = await user2.getAddress();

    _taskTreasury = await ethers.getContractFactory("TaskTreasury");
    _pokeMe = await ethers.getContractFactory("PokeMe2");
    _counter = await ethers.getContractFactory("Counter");
    _counterResolver = await ethers.getContractFactory("CounterResolver");

    dai = await ethers.getContractAt("IERC20", DAI);
    taskTreasury = await _taskTreasury.deploy(gelatoAddress);
    pokeMe = await _pokeMe.deploy(gelatoAddress, taskTreasury.address);
    counter = await _counter.deploy();
    counterResolver = await _counterResolver.deploy(counter.address);

    executorAddress = gelatoAddress;

    await taskTreasury.addWhitelistedService(pokeMe.address);

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [executorAddress],
    });
    executor = await ethers.provider.getSigner(executorAddress);

    resolverData = await counterResolver.interface.encodeFunctionData(
      "canExecGetPayload",
      []
    );

    selector = await pokeMe.getSelector("increaseCount(uint256)");
    taskId = await pokeMe.getTaskId(userAddress, counter.address, selector);

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
        userAddress,
        counter.address,
        selector,
        counterResolver.address,
        taskId,
        resolverData
      );

    taskHash = await pokeMe.getTaskId(userAddress, counter.address, selector);
  });

  it("sender already started task", async () => {
    await expect(
      pokeMe
        .connect(user)
        .createTask(
          counter.address,
          selector,
          counterResolver.address,
          resolverData
        )
    ).to.be.revertedWith("PokeMe: createTask: Sender already started task");
  });

  it("sender did not start task", async () => {
    await pokeMe.connect(user).cancelTask(taskHash);

    await expect(pokeMe.connect(user).cancelTask(taskHash)).to.be.revertedWith(
      "PokeMe: cancelTask: Sender did not start task yet"
    );
  });

  it("deposit and withdraw ETH", async () => {
    const depositAmount = ethers.utils.parseEther("1");

    await taskTreasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });

    expect(await taskTreasury.userTokenBalance(userAddress, ETH)).to.be.eq(
      ethers.utils.parseEther("1")
    );

    await expect(
      taskTreasury
        .connect(user)
        .withdrawFunds(ETH, ethers.utils.parseEther("1"))
    )
      .to.emit(taskTreasury, "FundsWithdrawn")
      .withArgs(userAddress, ETH, depositAmount);

    expect(await taskTreasury.userTokenBalance(userAddress, ETH)).to.be.eq(
      ethers.BigNumber.from("0")
    );
  });

  it("deposit and withdraw DAI", async () => {
    const depositAmount = ethers.utils.parseEther("1");
    const DAI_checksum = ethers.utils.getAddress(DAI);

    await getTokenFromFaucet(DAI, userAddress, depositAmount);

    await dai.approve(taskTreasury.address, depositAmount);
    await expect(
      taskTreasury.connect(user).depositFunds(userAddress, DAI, depositAmount)
    )
      .to.emit(taskTreasury, "FundsDeposited")
      .withArgs(userAddress, DAI_checksum, depositAmount);

    expect(await taskTreasury.userTokenBalance(userAddress, DAI)).to.be.eq(
      ethers.utils.parseEther("1")
    );

    await expect(taskTreasury.connect(user).withdrawFunds(DAI, depositAmount))
      .to.emit(taskTreasury, "FundsWithdrawn")
      .withArgs(userAddress, DAI_checksum, depositAmount);

    expect(await taskTreasury.userTokenBalance(userAddress, DAI)).to.be.eq(
      ethers.BigNumber.from("0")
    );
  });

  it("user withdraw more ETH than balance", async () => {
    const depositAmount = ethers.utils.parseEther("10");

    await taskTreasury
      .connect(user2)
      .depositFunds(user2Address, ETH, depositAmount, { value: depositAmount });

    const balanceBefore = await ethers.provider.getBalance(pokeMe.address);

    await taskTreasury.connect(user).withdrawFunds(ETH, ethers.utils.parseEther("1"));

    const balanceAfter = await ethers.provider.getBalance(pokeMe.address);

    expect(balanceAfter).to.be.eql(balanceBefore);
    expect(await taskTreasury.userTokenBalance(user2Address, ETH)).to.be.eql(
      depositAmount
    );
    expect(Number(await taskTreasury.userTokenBalance(userAddress, ETH))).to.be.eql(0);
  });

  it("user withdraw more DAI than balance", async () => {
    const depositAmount = ethers.utils.parseEther("10");

    await getTokenFromFaucet(DAI, user2Address, depositAmount);

    await dai.connect(user2).approve(taskTreasury.address, depositAmount);
    await taskTreasury.connect(user2).depositFunds(user2Address, DAI, depositAmount);

    const balanceBefore = await dai.balanceOf(taskTreasury.address);

    await taskTreasury.connect(user).withdrawFunds(DAI, ethers.utils.parseEther("1"));

    const balanceAfter = await dai.balanceOf(taskTreasury.address);

    expect(balanceAfter).to.be.eql(balanceBefore);
    expect(await taskTreasury.userTokenBalance(user2Address, DAI)).to.be.eql(
      depositAmount
    );
    expect(Number(await taskTreasury.userTokenBalance(userAddress, DAI))).to.be.eql(0);
  });

  it("no task found when exec", async () => {
    const THREE_MIN = 3 * 60;

    await network.provider.send("evm_increaseTime", [THREE_MIN]);
    await network.provider.send("evm_mine", []);

    await pokeMe.connect(user).cancelTask(taskHash);
    let [, execData] = await counterResolver.canExecGetPayload();

    await expect(
      pokeMe
        .connect(executor)
        .exec(ethers.utils.parseEther("1"), DAI, userAddress, counter.address, execData)
    ).to.be.revertedWith("PokeMe: exec: No task found");
  });

  it("canExec should be true, caller does not have enough ETH", async () => {
    const THREE_MIN = 3 * 60;

    await network.provider.send("evm_increaseTime", [THREE_MIN]);
    await network.provider.send("evm_mine", []);

    const depositAmount = ethers.utils.parseEther("0.5");
    await taskTreasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });

    let [canExec, execData] = await counterResolver.canExecGetPayload();
    expect(canExec).to.be.eq(true);

    await expect(
      pokeMe
        .connect(executor)
        .exec(
          ethers.utils.parseEther("1"),
          ETH,
          userAddress,
          counter.address,
          execData
        )
    ).to.be.reverted;
  });

  it("canExec should be true, caller does not have enough DAI", async () => {
    const THREE_MIN = 3 * 60;

    await network.provider.send("evm_increaseTime", [THREE_MIN]);
    await network.provider.send("evm_mine", []);

    let [canExec, execData] = await counterResolver.canExecGetPayload();
    expect(canExec).to.be.eq(true);

    const depositAmount = ethers.utils.parseEther("0.5");
    await getTokenFromFaucet(DAI, userAddress, depositAmount);

    await dai.connect(user).approve(taskTreasury.address, depositAmount);
    await taskTreasury.connect(user).depositFunds(userAddress, DAI, depositAmount);

    await expect(
      pokeMe
        .connect(executor)
        .exec(ethers.utils.parseEther("1"), DAI, userAddress, counter.address, execData)
    ).to.be.revertedWith(
      "reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)"
    );

    expect(await taskTreasury.userTokenBalance(userAddress, DAI)).to.be.eql(
      depositAmount
    );
  });

  it("canExec should be true, executor should exec", async () => {
    let [canExec, execData] = await counterResolver.canExecGetPayload();
    expect(canExec).to.be.eq(true);

    const THREE_MIN = 3 * 60;

    await network.provider.send("evm_increaseTime", [THREE_MIN]);
    await network.provider.send("evm_mine", []);

    expect(await counter.count()).to.be.eq(ethers.BigNumber.from("0"));

    const depositAmount = ethers.utils.parseEther("1");
    await taskTreasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });

    expect(
      await taskTreasury.connect(user).userTokenBalance(userAddress, ETH)
    ).to.be.eq(ethers.utils.parseEther("1"));

    await pokeMe
      .connect(executor)
      .exec(
        ethers.utils.parseEther("1"),
        ETH,
        userAddress,
        counter.address,
        execData
      );

    expect(await counter.count()).to.be.eq(ethers.BigNumber.from("100"));
    expect(
      await taskTreasury.connect(user).userTokenBalance(userAddress, ETH)
    ).to.be.eq(ethers.BigNumber.from("0"));

    // time not elapsed
    await expect(
      pokeMe
        .connect(executor)
        .exec(
          ethers.utils.parseEther("1"),
          ETH,
          userAddress,
          counter.address,
          execData
        )
    ).to.be.revertedWith("PokeMe: exec: Execution failed");
  });

  it("should exec and pay with ERC20 token", async () => {
    // await expect (pokeMe
    //   .connect(executor)
    //   .exec(
    //     ethers.utils.parseEther("1"),
    //     ETH,
    //     userAddress,
    //     counter.address,
    //     execData
    //   )).to.be.revertedWith("PokeMe: exec: Execution failed");
    

    // let [canExec, execData2] = await counterResolver.canExecGetPayload();

    // expect(canExec).to.be.eq(false);

    // const THREE_MIN = 3 * 70; // add 10 sec buffer

    // await network.provider.send("evm_increaseTime", [THREE_MIN]);
    // await network.provider.send("evm_mine", []);

    // [canExec, execData2] = await counterResolver.canExecGetPayload();

    // expect(canExec).to.be.eq(true);

    // expect(await counter.count()).to.be.eq(ethers.BigNumber.from("100"));

    // const daiAmount = ethers.utils.parseEther("100");

    // await dai.approve(taskTreasury.address, daiAmount);

    // await taskTreasury.connect(user).depositFunds(userAddress, DAI, daiAmount);

    // expect(
    //   await taskTreasury.connect(user).userTokenBalance(userAddress, DAI)
    // ).to.be.eq(daiAmount);

    // await pokeMe
    //   .connect(executor)
    //   .exec(
    //     ethers.utils.parseEther("90"),
    //     DAI,
    //     userAddress,
    //     counter.address,
    //     execData2
    //   );

    // expect(await counter.count()).to.be.eq(ethers.BigNumber.from("200"));
    // expect(
    //   await taskTreasury.connect(user).userTokenBalance(userAddress, DAI)
    // ).to.be.eq(ethers.utils.parseEther("10"));

    // // time not elapsed
    // await expect(
    //   pokeMe
    //     .connect(executor)
    //     .exec(
    //       ethers.utils.parseEther("1"),
    //       DAI,
    //       userAddress,
    //       counter.address,
    //       execData2
    //     )
    // ).to.be.revertedWith("PokeMe: exec: Execution failed");
  });

  it("getTaskIdsByUser test", async () => {
    // fake task
    await pokeMe
      .connect(user)
      .createTask(userAddress, selector, counterResolver.address, resolverData);
    const ids = await pokeMe.getTaskIdsByUser(userAddress);

    expect(ids.length).to.be.eql(2);
  });

  it("getCreditTokensByUser test", async () => {
    const depositAmount = ethers.utils.parseEther("1");

    await getTokenFromFaucet(DAI, userAddress, depositAmount);

    await dai.approve(taskTreasury.address, depositAmount);

    await taskTreasury.connect(user).depositFunds(userAddress, DAI, depositAmount);

    await taskTreasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });

    expect(await taskTreasury.userTokenBalance(userAddress, ETH)).to.be.eql(
      depositAmount
    );
    expect(await taskTreasury.userTokenBalance(userAddress, DAI)).to.be.eql(
      depositAmount
    );
  });
});
