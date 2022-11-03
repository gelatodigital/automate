import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import {
  encodeResolverArgs,
  encodeTimeArgs,
  fastForwardTime,
  getTaskId,
  getTimeStampNow,
  Module,
  ModuleData,
} from "./utils";
import hre = require("hardhat");
const { ethers, deployments } = hre;
import {
  Ops,
  CounterWL,
  CounterResolver,
  TaskTreasuryUpgradable,
  ResolverModule,
  TimeModule,
  ProxyModule,
  SingleExecModule,
  OpsProxyFactory,
  OpsProxy,
} from "../typechain";

const GELATO = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ZERO_ADD = ethers.constants.AddressZero;
const FEE = ethers.utils.parseEther("0.1");
const INTERVAL = 7 * 60;

describe("Ops multi module test", function () {
  let ops: Ops;
  let counter: CounterWL;
  let counterResolver: CounterResolver;
  let taskTreasury: TaskTreasuryUpgradable;
  let opsProxyFactory: OpsProxyFactory;
  let opsProxy: OpsProxy;

  let resolverModule: ResolverModule;
  let timeModule: TimeModule;
  let proxyModule: ProxyModule;
  let singleExecModule: SingleExecModule;

  let user: Signer;
  let userAddress: string;

  let executor: Signer;

  let taskId: string;
  let execSelector: string;
  let moduleData: ModuleData;
  let timeArgs: string;
  let resolverArgs: string;
  let startTime: number;

  beforeEach(async function () {
    await deployments.fixture();

    [, user] = await hre.ethers.getSigners();
    userAddress = await user.getAddress();

    ops = await ethers.getContract("Ops");
    taskTreasury = await ethers.getContract("TaskTreasuryUpgradable");
    counter = await ethers.getContract("CounterWL");
    counterResolver = await ethers.getContract("CounterResolver");
    opsProxyFactory = await ethers.getContract("OpsProxyFactory");

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

    // deploy proxy
    await opsProxyFactory.connect(user).deploy();

    // create task
    const resolverData =
      counterResolver.interface.encodeFunctionData("checker");
    resolverArgs = encodeResolverArgs(counterResolver.address, resolverData);

    startTime = (await getTimeStampNow()) + INTERVAL;
    timeArgs = encodeTimeArgs(startTime, INTERVAL);
    execSelector = counter.interface.getSighash("increaseCount");
    moduleData = {
      modules: [Module.RESOLVER, Module.TIME, Module.PROXY, Module.SINGLE_EXEC],
      args: [resolverArgs, timeArgs, "0x", "0x"],
    };

    taskId = getTaskId(
      userAddress,
      counter.address,
      execSelector,
      moduleData,
      ZERO_ADD
    );

    await ops
      .connect(user)
      .createTask(counter.address, execSelector, moduleData, ZERO_ADD);

    const [proxyAddress] = await opsProxyFactory.getProxyOf(userAddress);
    opsProxy = await ethers.getContractAt("OpsProxy", proxyAddress);

    // whitelist proxy on counter
    await counter.setWhitelist(opsProxy.address, true);
    expect(await counter.whitelisted(opsProxy.address)).to.be.true;
  });

  it("getTaskId", async () => {
    const thisTaskId = await ops[
      "getTaskId(address,address,bytes4,(uint8[],bytes[]),address)"
    ](userAddress, counter.address, execSelector, moduleData, ZERO_ADD);

    const expectedTaskId = taskId;

    expect(thisTaskId).to.be.eql(expectedTaskId);
  });

  it("task created", async () => {
    const taskIds = await ops.getTaskIdsByUser(userAddress);
    expect(taskIds).include(taskId);
  });

  it("time initialised", async () => {
    const time = await ops.timedTask(taskId);

    expect(time.nextExec).to.be.eql(ethers.BigNumber.from(startTime));
    expect(time.interval).to.be.eql(ethers.BigNumber.from(INTERVAL));
  });

  it("wrong module order", async () => {
    moduleData = {
      modules: [Module.RESOLVER, Module.SINGLE_EXEC, Module.TIME, Module.PROXY],
      args: [resolverArgs, "0x", timeArgs, "0x"],
    };

    await expect(
      ops
        .connect(user)
        .createTask(counter.address, execSelector, moduleData, ZERO_ADD)
    ).to.be.revertedWith("Ops._validModules: Asc only");
  });

  it("duplicate modules", async () => {
    moduleData = {
      modules: [Module.RESOLVER, Module.RESOLVER],
      args: [resolverArgs, resolverArgs],
    };

    await expect(
      ops
        .connect(user)
        .createTask(counter.address, execSelector, moduleData, ZERO_ADD)
    ).to.be.revertedWith("Ops._validModules: Asc only");
  });

  it("no modules", async () => {
    await counter.setWhitelist(ops.address, true);
    expect(await counter.whitelisted(ops.address)).to.be.true;
    moduleData = { modules: [], args: [] };
    const execData = counter.interface.encodeFunctionData("increaseCount", [
      10,
    ]);

    await ops
      .connect(user)
      .createTask(counter.address, execData, moduleData, ZERO_ADD);

    const countBefore = await counter.count();

    await execute(true);

    const countAfter = await counter.count();
    expect(countAfter).to.be.gt(countBefore);
  });

  it("exec - time should revert", async () => {
    await expect(execute(true)).to.be.revertedWith(
      "Ops.preExecCall: TimeModule: Too early"
    );
  });

  it("exec", async () => {
    await fastForwardTime(INTERVAL);
    const countBefore = await counter.count();

    await execute(true);

    const countAfter = await counter.count();
    expect(countAfter).to.be.gt(countBefore);

    const time = await ops.timedTask(taskId);
    expect(time.nextExec).to.be.eql(ethers.BigNumber.from(0));

    const taskIds = await ops.getTaskIdsByUser(userAddress);
    expect(taskIds).to.not.include(taskId);
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
