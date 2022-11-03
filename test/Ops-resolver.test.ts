import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import {
  encodeResolverArgs,
  getLegacyTaskId,
  getResolverHash,
  Module,
  ModuleData,
} from "./utils";
import hre = require("hardhat");
const { ethers, deployments } = hre;
import {
  Ops,
  CounterTest,
  CounterResolver,
  TaskTreasuryUpgradable,
  ResolverModule,
  ProxyModule,
  TimeModule,
} from "../typechain";

const GELATO = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ZERO_ADD = ethers.constants.AddressZero;
const FEE = ethers.utils.parseEther("0.1");

describe("Ops Resolver module test", function () {
  let ops: Ops;
  let counter: CounterTest;
  let counterResolver: CounterResolver;
  let treasury: TaskTreasuryUpgradable;
  let resolverModule: ResolverModule;
  let proxyModule: ProxyModule;
  let timeModule: TimeModule;

  let user: Signer;
  let userAddress: string;

  let executor: Signer;

  let taskId: string;
  let execSelector: string;
  let moduleData: ModuleData;

  beforeEach(async function () {
    await deployments.fixture();

    [, user] = await hre.ethers.getSigners();
    userAddress = await user.getAddress();

    ops = await ethers.getContract("Ops");
    treasury = await ethers.getContract("TaskTreasuryUpgradable");
    counter = await ethers.getContract("CounterTest");
    counterResolver = await ethers.getContract("CounterResolver");
    resolverModule = await ethers.getContract("ResolverModule");
    proxyModule = await ethers.getContract("ProxyModule");
    timeModule = await ethers.getContract("TimeModule");

    // set-up
    await treasury.updateWhitelistedService(ops.address, true);
    await ops.setModule(
      [Module.RESOLVER, Module.TIME, Module.PROXY],
      [resolverModule.address, timeModule.address, proxyModule.address]
    );

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [GELATO],
    });
    executor = ethers.provider.getSigner(GELATO);
    // deposit funds
    const depositAmount = ethers.utils.parseEther("1");
    await treasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });

    // create task
    const resolverData =
      counterResolver.interface.encodeFunctionData("checker");
    const resolverArgs = encodeResolverArgs(
      counterResolver.address,
      resolverData
    );
    execSelector = counter.interface.getSighash("increaseCount");
    moduleData = {
      modules: [Module.RESOLVER],
      args: [resolverArgs],
    };
    const resolverHash = getResolverHash(counterResolver.address, resolverData);
    taskId = getLegacyTaskId(
      userAddress,
      counter.address,
      execSelector,
      true,
      ZERO_ADD,
      resolverHash
    );

    await ops
      .connect(user)
      .createTask(counter.address, execSelector, moduleData, ZERO_ADD);
  });

  it("create task", async () => {
    const taskIds = await ops.getTaskIdsByUser(userAddress);
    expect(taskIds).include(taskId);
  });

  it("create task - duplicate", async () => {
    await expect(
      ops
        .connect(user)
        .createTask(counter.address, execSelector, moduleData, ZERO_ADD)
    ).to.be.revertedWith("Ops.createTask: Duplicate task");
  });

  it("cancel non existant task", async () => {
    await ops.connect(user).cancelTask(taskId);

    await expect(ops.connect(user).cancelTask(taskId)).to.be.revertedWith(
      "Ops.cancelTask: Task not found"
    );
  });

  it("exec", async () => {
    const countBefore = await counter.count();

    await execute(true);

    const countAfter = await counter.count();
    expect(countAfter).to.be.gt(countBefore);
  });

  it("exec - call reverts", async () => {
    const count = await counter.count();

    await execute(true);

    const count2 = await counter.count();
    expect(count2).to.be.gt(count);

    // will fail in off-chain simulation
    await expect(execute(true)).to.be.revertedWith(
      "Ops.exec: Counter: increaseCount: Time not elapsed"
    );
    // will not fail on-chain
    const balanceBefore = await treasury.userTokenBalance(userAddress, ETH);

    await execute(false);

    const balanceAfter = await treasury.userTokenBalance(userAddress, ETH);
    const count3 = await counter.count();
    expect(count3).to.be.eql(count2);
    expect(balanceAfter).to.be.lt(balanceBefore);
  });

  it("getTaskIdsByUser", async () => {
    // create 2nd task
    await ops
      .connect(user)
      .createTask(counter.address, execSelector, moduleData, ETH);
    const taskIds = await ops.getTaskIdsByUser(userAddress);

    expect(taskIds.length).to.be.eql(2);
    expect(taskIds).include(taskId);
  });

  const execute = async (revertOnFailure: boolean) => {
    const [, execData] = await counterResolver.checker();

    await ops
      .connect(executor)
      .exec(
        userAddress,
        counter.address,
        execData,
        moduleData,
        FEE,
        ETH,
        true,
        revertOnFailure
      );
  };
});
