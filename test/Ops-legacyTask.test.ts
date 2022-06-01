import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import {
  encodeResolverArgs,
  encodeTimeArgs,
  getTaskId,
  getTimeStampNow,
  Module,
  ModuleData,
} from "./utils";
import hre = require("hardhat");
const { ethers, deployments } = hre;
import {
  Ops,
  CounterWithWhitelist,
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

const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ZERO_ADD = ethers.constants.AddressZero;

describe("Ops legacy task test", function () {
  let ops: Ops;
  let legacyOps: ILegacyOps;
  let counter: CounterWithWhitelist;
  let counterResolver: CounterResolver;
  let taskTreasury: TaskTreasuryUpgradable;
  let events: LibEvents;

  let resolverModule: ResolverModule;
  let timeModule: TimeModule;
  let proxyModule: ProxyModule;
  let singleExecModule: SingleExecModule;

  let user: Signer;
  let userAddress: string;

  let execSelector: string;
  let resolverData: string;

  beforeEach(async function () {
    await deployments.fixture();

    [, user] = await hre.ethers.getSigners();
    userAddress = await user.getAddress();

    const counterFactory = await ethers.getContractFactory(
      "CounterWithWhitelist"
    );

    ops = await ethers.getContract("Ops");
    taskTreasury = await ethers.getContract("TaskTreasuryUpgradable");
    counter = <CounterWithWhitelist>await counterFactory.deploy();
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

    // deposit funds
    const depositAmount = ethers.utils.parseEther("1");
    await taskTreasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });

    execSelector = counter.interface.getSighash("increaseCount");
    resolverData = counterResolver.interface.encodeFunctionData("checker");
  });

  it("create task", async () => {
    const moduleData: ModuleData = {
      modules: [Module.RESOLVER],
      args: [encodeResolverArgs(counterResolver.address, resolverData)],
    };

    const taskId = getTaskId(
      userAddress,
      counter.address,
      execSelector,
      moduleData,
      ZERO_ADD
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
    expect(txn.events).to.not.be.null;
    if (!txn.events) return;

    // TaskCreated
    const decoded = events.interface.decodeEventLog(
      "TaskCreated",
      txn.events[0].data,
      txn.events[0].topics
    );

    expect(decoded.taskCreator).to.be.eql(userAddress);
    expect(decoded.execAddress).to.be.eql(counter.address);
    expect(decoded.execData).to.be.eql(execSelector);
    expect(decoded.moduleData.modules).to.be.eql(moduleData.modules);
    expect(decoded.moduleData.args).to.be.eql(moduleData.args);
    expect(decoded.feeToken).to.be.eql(ZERO_ADD);
    expect(decoded.taskId).to.be.eql(taskId);
  });

  it("create task no prepayment", async () => {
    const moduleData: ModuleData = {
      modules: [Module.RESOLVER],
      args: [encodeResolverArgs(counterResolver.address, resolverData)],
    };

    const taskId = getTaskId(
      userAddress,
      counter.address,
      execSelector,
      moduleData,
      ETH
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
    expect(txn.events).to.not.be.null;

    if (!txn.events) return;

    // TaskCreated
    const decoded = events.interface.decodeEventLog(
      "TaskCreated",
      txn.events[0].data,
      txn.events[0].topics
    );

    expect(decoded.taskCreator).to.be.eql(userAddress);
    expect(decoded.execAddress).to.be.eql(counter.address);
    expect(decoded.execData).to.be.eql(execSelector);
    expect(decoded.moduleData.modules).to.be.eql(moduleData.modules);
    expect(decoded.moduleData.args).to.be.eql(moduleData.args);
    expect(decoded.feeToken).to.be.eql(ETH);
    expect(decoded.taskId).to.be.eql(taskId);
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

    const taskId = getTaskId(
      userAddress,
      counter.address,
      execSelector,
      moduleData,
      ETH
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
        ETH
      );
    const txn = await res.wait();
    expect(txn.events).to.not.be.null;

    if (!txn.events) return;

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
    expect(decoded2.execData).to.be.eql(execSelector);
    expect(decoded2.moduleData.modules).to.be.eql(moduleData.modules);
    expect(decoded2.moduleData.args).to.be.eql(moduleData.args);
    expect(decoded2.feeToken).to.be.eql(ETH);
    expect(decoded2.taskId).to.be.eql(taskId);
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
});
