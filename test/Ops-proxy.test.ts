import { expect } from "chai";
import hre = require("hardhat");
const { ethers, deployments } = hre;
import { Signer } from "@ethersproject/abstract-signer";
import {
  CounterWithWhitelist,
  Ops,
  TaskTreasuryUpgradable,
  OpsProxy,
  OpsProxyFactory,
  ProxyModule,
} from "../typechain";
import { getTaskId, Module, ModuleData } from "./utils";

const GELATO = "0x3CACa7b48D0573D793d3b0279b5F0029180E83b6";
const ETH = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const ZERO_ADD = ethers.constants.AddressZero;
const FEE = ethers.utils.parseEther("0.1");

describe("Ops Proxy module test", function () {
  this.timeout(0);

  let deployer: Signer;
  let executor: Signer;
  let user: Signer;

  let userAddress: string;

  let ops: Ops;
  let opsProxy: OpsProxy;
  let opsProxyImplementation: OpsProxy;
  let opsProxyFactory: OpsProxyFactory;
  let treasury: TaskTreasuryUpgradable;
  let counter: CounterWithWhitelist;
  let proxyModule: ProxyModule;

  let execData: string;
  let taskId: string;
  let moduleData: ModuleData;

  beforeEach(async function () {
    await deployments.fixture();
    [deployer, user] = await ethers.getSigners();
    userAddress = await user.getAddress();

    treasury = await ethers.getContract("TaskTreasuryUpgradable");

    const counterFactory = await ethers.getContractFactory(
      "CounterWithWhitelist"
    );

    ops = await ethers.getContract("Ops");
    proxyModule = await ethers.getContract("ProxyModule");
    counter = <CounterWithWhitelist>await counterFactory.deploy();
    opsProxyFactory = await ethers.getContract("OpsProxyFactory");
    opsProxyImplementation = await ethers.getContract("OpsProxy");

    // get accounts
    const depositAmount = ethers.utils.parseEther("10");

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [GELATO],
    });

    executor = await ethers.getSigner(GELATO);

    // set-up
    await treasury.updateWhitelistedService(ops.address, true);
    await ops.setModule([Module.PROXY], [proxyModule.address]);

    await treasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });

    // create task
    const execSelector = counter.interface.getSighash("increaseCount");
    execData = counter.interface.encodeFunctionData("increaseCount", [10]);
    moduleData = { modules: [Module.PROXY], args: ["0x"] };

    taskId = getTaskId(
      userAddress,
      counter.address,
      execSelector,
      moduleData,
      ZERO_ADD
    );

    await ops
      .connect(user)
      .createTask(counter.address, execData, moduleData, ZERO_ADD);
  });

  it("create task", async () => {
    const taskIds = await ops.getTaskIdsByUser(userAddress);
    expect(taskIds).to.include(taskId);
  });

  it("proxy deployed", async () => {
    const determinedProxyAddress = await opsProxyFactory.determineProxyAddress(
      userAddress
    );

    const [proxyAddress, isDeployed] = await opsProxyFactory.getProxyOf(
      userAddress
    );
    opsProxy = await ethers.getContractAt("OpsProxy", proxyAddress);

    expect(isDeployed).to.be.true;
    expect(proxyAddress).to.be.eql(determinedProxyAddress);

    expect(await opsProxy.ops()).to.be.eql(ops.address);
    expect(await opsProxy.owner()).to.be.eql(userAddress);
    expect(await opsProxyFactory.isProxy(proxyAddress)).to.be.true;
  });

  it("proxy properly initialized", async () => {
    expect(await opsProxyFactory.implementation()).to.be.eql(
      opsProxyImplementation.address
    );

    expect(await opsProxy.ops()).to.be.eql(ops.address);
    expect(await opsProxy.owner()).to.be.eql(userAddress);
  });

  it("exec - whitelist", async () => {
    await expect(execute(counter.address)).to.be.revertedWith(
      "Counter: Not whitelisted"
    );
  });

  it("exec - no whitelist", async () => {
    // // whitelist proxy on counter
    await counter.connect(deployer).setWhitelist(opsProxy.address, true);
    expect(await counter.whitelisted(opsProxy.address)).to.be.true;

    const countBefore = await counter.count();
    await execute(counter.address);
    const countAfter = await counter.count();
    expect(countAfter).to.be.gt(countBefore);
  });

  it("batchExecuteCall", async () => {
    const counter2Factory = await ethers.getContractFactory(
      "CounterWithWhitelist"
    );
    const counter2 = await counter2Factory.deploy();

    // // whitelist proxy on counter
    await counter.connect(deployer).setWhitelist(opsProxy.address, true);
    expect(await counter.whitelisted(opsProxy.address)).to.be.true;
    await counter2.connect(deployer).setWhitelist(opsProxy.address, true);
    expect(await counter2.whitelisted(opsProxy.address)).to.be.true;

    const targets = [counter.address, counter2.address];
    const datas = [execData, execData];
    const values = [0, 0];

    const batchExecuteCallData = opsProxy.interface.encodeFunctionData(
      "batchExecuteCall",
      [targets, datas, values]
    );

    execData = batchExecuteCallData;

    await ops
      .connect(user)
      .createTask(opsProxy.address, execData, moduleData, ZERO_ADD);

    const countBefore = await counter.count();
    const count2Before = await counter2.count();

    await execute(opsProxy.address);

    const countAfter = await counter.count();
    const count2After = await counter2.count();
    expect(countAfter).to.be.gt(countBefore);
    expect(count2After).to.be.gt(count2Before);
  });

  const execute = async (execAddress: string) => {
    await ops
      .connect(executor)
      .exec(
        userAddress,
        execAddress,
        execData,
        moduleData,
        FEE,
        ETH,
        true,
        true
      );
  };
});