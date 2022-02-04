import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import { getTokenFromFaucet } from "./helpers";
import hre = require("hardhat");
const { ethers, deployments } = hre;
import {
  Ops,
  Counter,
  CounterResolver,
  TaskTreasury,
  IERC20,
} from "../typechain";
import { BigNumber } from "ethereum-waffle/node_modules/ethers";

const diamondAddress = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";

describe("Ops test", function () {
  let ops: Ops;
  let counter: Counter;
  let counterResolver: CounterResolver;
  let taskTreasury: TaskTreasury;
  let dai: IERC20;

  let user: Signer;
  let userAddress: string;

  let user2: Signer;
  let user2Address: string;

  let diamondSigner: Signer;

  let resolverData: string;
  let taskHash: string;
  let selector: string;
  let resolverHash: string;

  beforeEach(async function () {
    await deployments.fixture();

    [user, user2] = await hre.ethers.getSigners();
    userAddress = await user.getAddress();
    user2Address = await user2.getAddress();

    ops = <Ops>await ethers.getContract("Ops");
    taskTreasury = <TaskTreasury>await ethers.getContract("TaskTreasury");
    counter = <Counter>await ethers.getContract("Counter");
    counterResolver = <CounterResolver>(
      await ethers.getContract("CounterResolver")
    );
    dai = <IERC20>await ethers.getContractAt("IERC20", DAI);

    await taskTreasury.addWhitelistedService(ops.address);

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [diamondAddress],
    });

    diamondSigner = await ethers.provider.getSigner(diamondAddress);

    resolverData = counterResolver.interface.encodeFunctionData("checker");

    selector = await ops.getSelector("increaseCount(uint256)");

    resolverHash = ethers.utils.keccak256(
      new ethers.utils.AbiCoder().encode(
        ["address", "bytes"],
        [counterResolver.address, resolverData]
      )
    );

    taskHash = await ops.getTaskId(
      userAddress,
      counter.address,
      selector,
      true,
      ethers.constants.AddressZero,
      resolverHash
    );

    await expect(
      ops
        .connect(user)
        .createTask(
          counter.address,
          selector,
          counterResolver.address,
          resolverData
        )
    )
      .to.emit(ops, "TaskCreated")
      .withArgs(
        userAddress,
        counter.address,
        selector,
        counterResolver.address,
        taskHash,
        resolverData,
        true,
        ethers.constants.AddressZero,
        resolverHash
      );
  });

  it("sender already started task", async () => {
    await expect(
      ops
        .connect(user)
        .createTask(
          counter.address,
          selector,
          counterResolver.address,
          resolverData
        )
    ).to.be.revertedWith("Ops: createTask: Sender already started task");
  });

  it("sender did not start task", async () => {
    await ops.connect(user).cancelTask(taskHash);

    await expect(ops.connect(user).cancelTask(taskHash)).to.be.revertedWith(
      "Ops: cancelTask: Sender did not start task yet"
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
        .withdrawFunds(userAddress, ETH, ethers.utils.parseEther("1"))
    )
      .to.emit(taskTreasury, "FundsWithdrawn")
      .withArgs(userAddress, userAddress, ETH, depositAmount);

    expect(await taskTreasury.userTokenBalance(userAddress, ETH)).to.be.eq(
      ethers.BigNumber.from("0")
    );
  });

  it("deposit and withdraw DAI", async () => {
    const depositAmount = ethers.utils.parseEther("1");
    const DAI_CHECKSUM = ethers.utils.getAddress(DAI);

    await getTokenFromFaucet(DAI, userAddress, depositAmount);

    await dai.approve(taskTreasury.address, depositAmount);
    await expect(
      taskTreasury.connect(user).depositFunds(userAddress, DAI, depositAmount)
    )
      .to.emit(taskTreasury, "FundsDeposited")
      .withArgs(userAddress, DAI_CHECKSUM, depositAmount);

    expect(await taskTreasury.userTokenBalance(userAddress, DAI)).to.be.eq(
      ethers.utils.parseEther("1")
    );

    await expect(
      taskTreasury.connect(user).withdrawFunds(userAddress, DAI, depositAmount)
    )
      .to.emit(taskTreasury, "FundsWithdrawn")
      .withArgs(userAddress, userAddress, DAI_CHECKSUM, depositAmount);

    expect(await taskTreasury.userTokenBalance(userAddress, DAI)).to.be.eq(
      ethers.BigNumber.from("0")
    );
  });

  it("user withdraw more ETH than balance", async () => {
    const depositAmount = ethers.utils.parseEther("10");

    await taskTreasury
      .connect(user2)
      .depositFunds(user2Address, ETH, depositAmount, { value: depositAmount });

    const balanceBefore = await ethers.provider.getBalance(ops.address);

    await taskTreasury
      .connect(user)
      .withdrawFunds(userAddress, ETH, ethers.utils.parseEther("1"));

    const balanceAfter = await ethers.provider.getBalance(ops.address);

    expect(balanceAfter).to.be.eql(balanceBefore);
    expect(await taskTreasury.userTokenBalance(user2Address, ETH)).to.be.eql(
      depositAmount
    );
    expect(
      Number(await taskTreasury.userTokenBalance(userAddress, ETH))
    ).to.be.eql(0);
  });

  it("user withdraw more DAI than balance", async () => {
    const depositAmount = ethers.utils.parseEther("10");

    await getTokenFromFaucet(DAI, user2Address, depositAmount);

    await dai.connect(user2).approve(taskTreasury.address, depositAmount);
    await taskTreasury
      .connect(user2)
      .depositFunds(user2Address, DAI, depositAmount);

    const balanceBefore = await dai.balanceOf(taskTreasury.address);

    await taskTreasury
      .connect(user)
      .withdrawFunds(userAddress, DAI, ethers.utils.parseEther("1"));

    const balanceAfter = await dai.balanceOf(taskTreasury.address);

    expect(balanceAfter).to.be.eql(balanceBefore);
    expect(await taskTreasury.userTokenBalance(user2Address, DAI)).to.be.eql(
      depositAmount
    );
    expect(
      Number(await taskTreasury.userTokenBalance(userAddress, DAI))
    ).to.be.eql(0);
  });

  it("no task found when exec", async () => {
    const THREE_MIN = 3 * 60;

    await hre.network.provider.send("evm_increaseTime", [THREE_MIN]);
    await hre.network.provider.send("evm_mine", []);

    await ops.connect(user).cancelTask(taskHash);
    const [, execData] = await counterResolver.checker();

    await expect(
      ops
        .connect(diamondSigner)
        .exec(
          ethers.utils.parseEther("1"),
          DAI,
          userAddress,
          true,
          false,
          resolverHash,
          counter.address,
          execData
        )
    ).to.be.revertedWith("Ops: exec: No task found");
  });

  it("canExec should be true, caller does not have enough ETH", async () => {
    const THREE_MIN = 3 * 60;

    await hre.network.provider.send("evm_increaseTime", [THREE_MIN]);
    await hre.network.provider.send("evm_mine", []);

    const depositAmount = ethers.utils.parseEther("0.5");
    await taskTreasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });

    const [canExec, execData] = await counterResolver.checker();
    expect(canExec).to.be.eq(true);

    await expect(
      ops
        .connect(diamondSigner)
        .exec(
          ethers.utils.parseEther("1"),
          ETH,
          userAddress,
          true,
          false,
          resolverHash,
          counter.address,
          execData
        )
    ).to.be.reverted;
  });

  it("canExec should be true, caller does not have enough DAI", async () => {
    const THREE_MIN = 3 * 60;

    await hre.network.provider.send("evm_increaseTime", [THREE_MIN]);
    await hre.network.provider.send("evm_mine", []);

    const [canExec, execData] = await counterResolver.checker();
    expect(canExec).to.be.eq(true);

    const depositAmount = ethers.utils.parseEther("0.5");
    await getTokenFromFaucet(DAI, userAddress, depositAmount);

    await dai.connect(user).approve(taskTreasury.address, depositAmount);
    await taskTreasury
      .connect(user)
      .depositFunds(userAddress, DAI, depositAmount);

    await expect(
      ops
        .connect(diamondSigner)
        .exec(
          ethers.utils.parseEther("1"),
          DAI,
          userAddress,
          true,
          false,
          resolverHash,
          counter.address,
          execData
        )
    ).to.be.reverted;

    expect(await taskTreasury.userTokenBalance(userAddress, DAI)).to.be.eql(
      depositAmount
    );
  });

  it("should exec and pay with ETH", async () => {
    const txFee = ethers.utils.parseEther("1");
    const [canExec, execData] = await counterResolver.checker();
    expect(canExec).to.be.eq(true);

    const THREE_MIN = 3 * 60;

    await hre.network.provider.send("evm_increaseTime", [THREE_MIN]);
    await hre.network.provider.send("evm_mine", []);

    expect(await counter.count()).to.be.eq(ethers.BigNumber.from("0"));

    const depositAmount = ethers.utils.parseEther("2");
    await taskTreasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });

    expect(
      await taskTreasury.connect(user).userTokenBalance(userAddress, ETH)
    ).to.be.eq(depositAmount);

    await ops
      .connect(diamondSigner)
      .exec(
        txFee,
        ETH,
        userAddress,
        true,
        false,
        resolverHash,
        counter.address,
        execData
      );

    expect(await counter.count()).to.be.eq(ethers.BigNumber.from("100"));
    expect(
      await taskTreasury.connect(user).userTokenBalance(userAddress, ETH)
    ).to.be.eq(depositAmount.sub(txFee));

    // time not elapsed
    await expect(
      simulateExec(
        txFee,
        ETH,
        userAddress,
        true,
        resolverHash,
        counter.address,
        execData
      )
    ).to.be.revertedWith("Ops.exec:Counter: increaseCount: Time not elapsed");
  });

  it("should exec and pay with DAI", async () => {
    const txFee = ethers.utils.parseEther("1");
    const [canExec, execData] = await counterResolver.checker();
    expect(canExec).to.be.eq(true);

    const THREE_MIN = 3 * 60;

    await hre.network.provider.send("evm_increaseTime", [THREE_MIN]);
    await hre.network.provider.send("evm_mine", []);

    const depositAmount = ethers.utils.parseEther("2");
    await getTokenFromFaucet(DAI, userAddress, depositAmount);

    await dai.connect(user).approve(taskTreasury.address, depositAmount);
    await taskTreasury
      .connect(user)
      .depositFunds(userAddress, DAI, depositAmount);

    expect(
      await taskTreasury.connect(user).userTokenBalance(userAddress, DAI)
    ).to.be.eq(depositAmount);

    await ops
      .connect(diamondSigner)
      .exec(
        txFee,
        DAI,
        userAddress,
        true,
        false,
        resolverHash,
        counter.address,
        execData
      );

    expect(await counter.count()).to.be.eq(ethers.BigNumber.from("100"));

    // time not elapsed
    await expect(
      simulateExec(
        txFee,
        DAI,
        userAddress,
        true,
        resolverHash,
        counter.address,
        execData
      )
    ).to.be.revertedWith("Ops.exec:Counter: increaseCount: Time not elapsed");
  });

  it("should exec and charge user even when it reverts", async () => {
    const txFee = ethers.utils.parseEther("1");
    const [, execData] = await counterResolver.checker();

    const depositAmount = ethers.utils.parseEther("2");
    await taskTreasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });

    // execute twice in a row
    await ops
      .connect(diamondSigner)
      .exec(
        txFee,
        ETH,
        userAddress,
        true,
        false,
        resolverHash,
        counter.address,
        execData
      );

    const count = await counter.count();
    expect(count).to.be.eq(ethers.BigNumber.from("100"));

    await ops
      .connect(diamondSigner)
      .exec(
        txFee,
        ETH,
        userAddress,
        true,
        false,
        resolverHash,
        counter.address,
        execData
      );

    expect(await counter.count()).to.be.eq(count);
    expect(await taskTreasury.userTokenBalance(userAddress, ETH)).to.be.eq(
      ethers.BigNumber.from("0")
    );
  });

  it("getTaskIdsByUser test", async () => {
    // fake task
    await ops
      .connect(user)
      .createTask(userAddress, selector, counterResolver.address, resolverData);
    const ids = await ops.getTaskIdsByUser(userAddress);

    expect(ids.length).to.be.eql(2);
  });

  it("getCreditTokensByUser test", async () => {
    const depositAmount = ethers.utils.parseEther("1");

    await getTokenFromFaucet(DAI, userAddress, depositAmount);

    await dai.approve(taskTreasury.address, depositAmount);

    await taskTreasury
      .connect(user)
      .depositFunds(userAddress, DAI, depositAmount);

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

  const simulateExec = async (
    _txFee: BigNumber,
    _feeToken: string,
    _taskCreator: string,
    _useTaskTreasury: boolean,
    _resolverHash: string,
    _execAddress: string,
    _execData: string
  ) => {
    await ops
      .connect(diamondSigner)
      .exec(
        _txFee,
        _feeToken,
        _taskCreator,
        _useTaskTreasury,
        true,
        _resolverHash,
        _execAddress,
        _execData
      );
  };
});
