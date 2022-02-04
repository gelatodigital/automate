import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import { getTokenFromFaucet } from "./helpers";
import hre = require("hardhat");
const { ethers, deployments } = hre;

const gelatoAddress = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

import {
  Ops,
  CounterWithoutTreasury,
  CounterResolverWithoutTreasury,
  TaskTreasury,
  IERC20,
} from "../typechain";

describe("Ops without treasury test", function () {
  let ops: Ops;
  let counter: CounterWithoutTreasury;
  let counterResolver: CounterResolverWithoutTreasury;
  let taskTreasury: TaskTreasury;
  let dai: IERC20;

  let user: Signer;
  let userAddress: string;

  let executor: any;
  let executorAddress: string;

  let resolverData: any;
  let taskHashETH: any;
  let taskHashDAI: any;
  let selector: any;
  let resolverHashETH: any;
  let resolverHashDAI: any;

  beforeEach(async function () {
    await deployments.fixture();

    [user] = await ethers.getSigners();
    userAddress = await user.getAddress();

    ops = <Ops>await ethers.getContract("Ops");
    taskTreasury = <TaskTreasury>await ethers.getContract("TaskTreasury");
    counter = <CounterWithoutTreasury>(
      await ethers.getContract("CounterWithoutTreasury")
    );
    counterResolver = <CounterResolverWithoutTreasury>(
      await ethers.getContract("CounterResolverWithoutTreasury")
    );
    dai = <IERC20>await ethers.getContractAt("IERC20", DAI);

    executorAddress = gelatoAddress;

    await taskTreasury.addWhitelistedService(ops.address);

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [executorAddress],
    });

    executor = await ethers.provider.getSigner(executorAddress);

    resolverData = await counterResolver.interface.encodeFunctionData(
      "checker"
    );

    selector = await ops.getSelector("increaseCount(uint256)");

    resolverHashETH = await ops.getResolverHash(
      counterResolver.address,
      resolverData
    );

    resolverHashDAI = await ops.getResolverHash(
      counterResolver.address,
      resolverData
    );

    taskHashETH = await ops.getTaskId(
      userAddress,
      counter.address,
      selector,
      false,
      ETH,
      resolverHashETH
    );

    taskHashDAI = await ops.getTaskId(
      userAddress,
      counter.address,
      selector,
      false,
      DAI,
      resolverHashDAI
    );

    await expect(
      ops
        .connect(user)
        .createTaskNoPrepayment(
          counter.address,
          selector,
          counterResolver.address,
          resolverData,
          ETH
        )
    )
      .to.emit(ops, "TaskCreated")
      .withArgs(
        userAddress,
        counter.address,
        selector,
        counterResolver.address,
        taskHashETH,
        resolverData,
        false,
        ETH,
        resolverHashETH
      );

    await expect(
      ops
        .connect(user)
        .createTaskNoPrepayment(
          counter.address,
          selector,
          counterResolver.address,
          resolverData,
          DAI
        )
    )
      .to.emit(ops, "TaskCreated")
      .withArgs(
        userAddress,
        counter.address,
        selector,
        counterResolver.address,
        taskHashDAI,
        resolverData,
        false,
        DAI,
        resolverHashDAI
      );
  });

  it("canExec should be true, counter does not have enough ETH", async () => {
    const THREE_MIN = 3 * 60;

    await hre.network.provider.send("evm_increaseTime", [THREE_MIN]);
    await hre.network.provider.send("evm_mine", []);

    const depositAmount = ethers.utils.parseEther("0.5");

    await user.sendTransaction({
      to: counter.address,
      value: depositAmount,
    });

    expect(await ethers.provider.getBalance(counter.address)).to.be.eq(
      depositAmount
    );

    const [canExec, execData] = await counterResolver.checker();
    expect(canExec).to.be.eq(true);

    // simulation should have failed
    await expect(
      ops
        .connect(executor)
        .exec(
          ethers.utils.parseEther("1"),
          ETH,
          userAddress,
          false,
          false,
          resolverHashETH,
          counter.address,
          execData
        )
    )
      .to.emit(ops, "ExecSuccess")
      .withArgs(
        ethers.utils.parseEther("1"),
        ETH,
        counter.address,
        execData,
        taskHashETH,
        false
      );
  });

  it("canExec should be true, counter does not have enough DAI", async () => {
    const THREE_MIN = 3 * 60;

    await hre.network.provider.send("evm_increaseTime", [THREE_MIN]);
    await hre.network.provider.send("evm_mine", []);

    const depositAmount = ethers.utils.parseEther("0.5");

    await getTokenFromFaucet(DAI, counter.address, depositAmount);

    expect(await dai.balanceOf(counter.address)).to.be.eq(depositAmount);

    const [canExec, execData] = await counterResolver.checker();
    expect(canExec).to.be.eq(true);

    // simulation should have failed
    await expect(
      ops
        .connect(executor)
        .exec(
          ethers.utils.parseEther("1"),
          DAI,
          userAddress,
          false,
          false,
          resolverHashDAI,
          counter.address,
          execData
        )
    )
      .to.emit(ops, "ExecSuccess")
      .withArgs(
        ethers.utils.parseEther("1"),
        DAI,
        counter.address,
        execData,
        taskHashDAI,
        false
      );
  });

  it("canExec should be true, counter have enough ETH", async () => {
    const THREE_MIN = 3 * 60;

    await hre.network.provider.send("evm_increaseTime", [THREE_MIN]);
    await hre.network.provider.send("evm_mine", []);

    const depositAmount = ethers.utils.parseEther("5");

    await user.sendTransaction({
      to: counter.address,
      value: depositAmount,
    });

    expect(await ethers.provider.getBalance(counter.address)).to.be.eq(
      depositAmount
    );

    const gelatoBalanceBefore = await ethers.provider.getBalance(gelatoAddress);

    const [canExec, execData] = await counterResolver.checker();
    expect(canExec).to.be.eq(true);

    await ops
      .connect(executor)
      .exec(
        ethers.utils.parseEther("1"),
        ETH,
        userAddress,
        false,
        false,
        resolverHashETH,
        counter.address,
        execData
      );

    const gelatoBalanceAfter = await ethers.provider.getBalance(gelatoAddress);
    expect(gelatoBalanceAfter).to.be.gt(gelatoBalanceBefore);
    expect(await counter.count()).to.be.eq(ethers.BigNumber.from("100"));
  });

  it("canExec should be true, counter does not have enough DAI", async () => {
    const THREE_MIN = 3 * 60;

    await hre.network.provider.send("evm_increaseTime", [THREE_MIN]);
    await hre.network.provider.send("evm_mine", []);

    const depositAmount = ethers.utils.parseEther("1");

    await getTokenFromFaucet(DAI, counter.address, depositAmount);

    expect(await dai.balanceOf(counter.address)).to.be.eq(depositAmount);

    const gelatoDaiBefore = await dai.balanceOf(gelatoAddress);

    const [canExec, execData] = await counterResolver.checker();
    expect(canExec).to.be.eq(true);

    await ops
      .connect(executor)
      .exec(
        ethers.utils.parseEther("1"),
        DAI,
        userAddress,
        false,
        false,
        resolverHashDAI,
        counter.address,
        execData
      );

    const gelatoDaiAfter = await dai.balanceOf(gelatoAddress);

    expect(gelatoDaiAfter).to.be.gt(gelatoDaiBefore);
    expect(await counter.count()).to.be.eq(ethers.BigNumber.from("100"));
  });
});
