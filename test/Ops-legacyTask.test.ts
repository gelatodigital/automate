import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import {
  encodeResolverArgs,
  encodeTimeArgs,
  fastForwardTime,
  getLegacyTaskId,
  getResolverHash,
  getTimeStampNow,
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
  TimeModule,
  ProxyModule,
  SingleExecModule,
  ILegacyOps,
  LibEvents__factory,
  LibEvents,
} from "../typechain";
import assert = require("assert");

const GELATO = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ZERO_ADD = ethers.constants.AddressZero;
const FEE = ethers.utils.parseEther("0.1");

describe("Ops legacy task test", function () {
  let ops: Ops;
  let legacyOps: ILegacyOps;
  let counter: CounterTest;
  let counterResolver: CounterResolver;
  let taskTreasury: TaskTreasuryUpgradable;
  let events: LibEvents;

  let resolverModule: ResolverModule;
  let timeModule: TimeModule;
  let proxyModule: ProxyModule;
  let singleExecModule: SingleExecModule;

  let executor: Signer;
  let user: Signer;
  let userAddress: string;

  let execSelector: string;
  let resolverData: string;

  beforeEach(async function () {
    await deployments.fixture();

    [, user] = await hre.ethers.getSigners();
    userAddress = await user.getAddress();

    ops = await ethers.getContract("Ops");
    taskTreasury = await ethers.getContract("TaskTreasuryUpgradable");
    counter = await ethers.getContract("CounterTest");
    counterResolver = await ethers.getContract("CounterResolver");
    legacyOps = await ethers.getContractAt("ILegacyOps", ops.address);
    events = LibEvents__factory.connect(ops.address, user);

    resolverModule = await ethers.getContract("ResolverModule");
    timeModule = await ethers.getContract("TimeModule");
    proxyModule = await ethers.getContract("ProxyModule");
    singleExecModule = await ethers.getContract("SingleExecModule");

    // set-up
    await taskTreasury.updateWhitelistedService(ops.address, true);
    await ops.setModule(
      [Module.RESOLVER, Module.TIME, Module.PROXY, Module.SINGLE_EXEC],
      [
        resolverModule.address,
        timeModule.address,
        proxyModule.address,
        singleExecModule.address,
      ]
    );

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [GELATO],
    });
    executor = ethers.provider.getSigner(GELATO);

    // deposit funds
    const depositAmount = ethers.utils.parseEther("1");
    await taskTreasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });

    execSelector = counter.interface.getSighash("increaseCount");
    resolverData = counterResolver.interface.encodeFunctionData("checker");
  });

  it("getTaskId", async () => {
    const resolverHash = getResolverHash(counterResolver.address, resolverData);
    const legacyTaskId = await ops[
      "getTaskId(address,address,bytes4,bool,address,bytes32)"
    ](userAddress, counter.address, execSelector, true, ZERO_ADD, resolverHash);

    const expectedLegacyTaskId = getLegacyTaskId(
      userAddress,
      counter.address,
      execSelector,
      true,
      ZERO_ADD,
      resolverHash
    );

    expect(legacyTaskId).to.be.eql(expectedLegacyTaskId);
  });

  it("create task", async () => {
    const moduleData: ModuleData = {
      modules: [Module.RESOLVER],
      args: [encodeResolverArgs(counterResolver.address, resolverData)],
    };

    const resolverHash = getResolverHash(counterResolver.address, resolverData);
    const taskId = getLegacyTaskId(
      userAddress,
      counter.address,
      execSelector,
      true,
      ZERO_ADD,
      resolverHash
    );

    const res = await legacyOps
      .connect(user)
      .createTask(
        counter.address,
        execSelector,
        counterResolver.address,
        resolverData
      );
    const txn = await res.wait();
    assert(txn.events);

    // TaskCreated
    const decoded = events.interface.decodeEventLog(
      "TaskCreated",
      txn.events[0].data,
      txn.events[0].topics
    );

    expect(decoded.taskCreator).to.be.eql(userAddress);
    expect(decoded.execAddress).to.be.eql(counter.address);
    expect(decoded.execDataOrSelector).to.be.eql(execSelector);
    expect(decoded.moduleData.modules).to.be.eql(moduleData.modules);
    expect(decoded.moduleData.args).to.be.eql(moduleData.args);
    expect(decoded.feeToken).to.be.eql(ZERO_ADD);
    expect(decoded.taskId).to.be.eql(taskId);

    const countBefore = await counter.count();

    await execute(true);

    const countAfter = await counter.count();
    expect(countAfter).to.be.gt(countBefore);
  });

  it("create task no prepayment", async () => {
    const moduleData: ModuleData = {
      modules: [Module.RESOLVER],
      args: [encodeResolverArgs(counterResolver.address, resolverData)],
    };

    const resolverHash = getResolverHash(counterResolver.address, resolverData);
    const taskId = getLegacyTaskId(
      userAddress,
      counter.address,
      execSelector,
      false,
      ETH,
      resolverHash
    );

    const res = await legacyOps
      .connect(user)
      .createTaskNoPrepayment(
        counter.address,
        execSelector,
        counterResolver.address,
        resolverData,
        ETH
      );
    const txn = await res.wait();
    assert(txn.events);

    // TaskCreated
    const decoded = events.interface.decodeEventLog(
      "TaskCreated",
      txn.events[0].data,
      txn.events[0].topics
    );

    expect(decoded.taskCreator).to.be.eql(userAddress);
    expect(decoded.execAddress).to.be.eql(counter.address);
    expect(decoded.execDataOrSelector).to.be.eql(execSelector);
    expect(decoded.moduleData.modules).to.be.eql(moduleData.modules);
    expect(decoded.moduleData.args).to.be.eql(moduleData.args);
    expect(decoded.feeToken).to.be.eql(ETH);
    expect(decoded.taskId).to.be.eql(taskId);

    const countBefore = await counter.count();

    await execute(false);

    const countAfter = await counter.count();
    expect(countAfter).to.be.gt(countBefore);
  });

  it("create timed task", async () => {
    const interval = 7 * 60;
    const startTime = (await getTimeStampNow()) + interval;

    const moduleData: ModuleData = {
      modules: [Module.RESOLVER, Module.TIME],
      args: [
        encodeResolverArgs(counterResolver.address, resolverData),
        encodeTimeArgs(startTime, interval),
      ],
    };

    const resolverHash = getResolverHash(counterResolver.address, resolverData);
    const taskId = getLegacyTaskId(
      userAddress,
      counter.address,
      execSelector,
      true,
      ZERO_ADD,
      resolverHash
    );
    const res = await legacyOps
      .connect(user)
      .createTimedTask(
        startTime,
        interval,
        counter.address,
        execSelector,
        counterResolver.address,
        resolverData,
        ZERO_ADD,
        true
      );
    const txn = await res.wait();
    assert(txn.events);

    // TimerSet
    const decoded = events.interface.decodeEventLog(
      "TimerSet",
      txn.events[0].data,
      txn.events[0].topics
    );
    expect(decoded.taskId).to.be.eql(taskId);
    expect(decoded.nextExec).to.be.eql(ethers.BigNumber.from(startTime));
    expect(decoded.interval).to.be.eql(ethers.BigNumber.from(interval));

    // TaskCreated
    const decoded2 = events.interface.decodeEventLog(
      "TaskCreated",
      txn.events[1].data,
      txn.events[1].topics
    );

    expect(decoded2.taskCreator).to.be.eql(userAddress);
    expect(decoded2.execAddress).to.be.eql(counter.address);
    expect(decoded2.execDataOrSelector).to.be.eql(execSelector);
    expect(decoded2.moduleData.modules).to.be.eql(moduleData.modules);
    expect(decoded2.moduleData.args).to.be.eql(moduleData.args);
    expect(decoded2.feeToken).to.be.eql(ZERO_ADD);
    expect(decoded2.taskId).to.be.eql(taskId);

    const countBefore = await counter.count();
    await fastForwardTime(interval);

    await execute(true);

    const countAfter = await counter.count();
    expect(countAfter).to.be.gt(countBefore);
  });

  it("fallback - data", async () => {
    const data = "0x12345678";
    await expect(
      user.sendTransaction({ to: ops.address, data })
    ).to.be.revertedWith("Ops.createTask: Function not found");
  });

  it("fallback - value", async () => {
    const value = ethers.utils.parseEther("0.1");
    await expect(user.sendTransaction({ to: ops.address, value })).to.be
      .reverted;
  });

  it("fallback - value & data", async () => {
    const data = "0x12345678";
    const value = ethers.utils.parseEther("0.1");
    await expect(user.sendTransaction({ to: ops.address, value, data })).to.be
      .reverted;
  });

  const execute = async (useTaskTreasury: boolean) => {
    const [, execData] = await counterResolver.checker();

    const resolverArg = encodeResolverArgs(
      counterResolver.address,
      resolverData
    );
    const moduleData: ModuleData = {
      modules: [Module.RESOLVER, Module.TIME],
      args: [resolverArg, "0x"],
    };
    await ops
      .connect(executor)
      .exec(
        userAddress,
        counter.address,
        execData,
        moduleData,
        FEE,
        ETH,
        useTaskTreasury,
        true
      );
  };
});
