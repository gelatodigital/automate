import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import {
  Automate,
  CounterWL,
  EIP173OpsProxy,
  OpsProxy,
  OpsProxyFactory,
  ProxyModule,
} from "../typechain";
import { Module, ModuleData, getTaskId } from "./utils";
import { getGelato1BalanceParam } from "./utils/1balance";
import hre = require("hardhat");
const { ethers, deployments } = hre;

const GELATO = "0x3CACa7b48D0573D793d3b0279b5F0029180E83b6";
const ETH = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const ZERO_ADD = ethers.constants.AddressZero;

describe("Automate Proxy module test", function () {
  this.timeout(0);

  let deployer: Signer;
  let executor: Signer;
  let user: Signer;
  let user2: Signer;

  let userAddress: string;
  let user2Address: string;

  let automate: Automate;
  let opsProxy: OpsProxy;
  let opsProxyImplementation: OpsProxy;
  let opsProxyFactory: OpsProxyFactory;
  let counter: CounterWL;
  let proxyModule: ProxyModule;

  let taskCreator: string;
  let execAddress: string;
  let execData: string;
  let execSelector: string;
  let taskId: string;
  let moduleData: ModuleData;

  beforeEach(async function () {
    await deployments.fixture();
    [deployer, user, user2] = await ethers.getSigners();
    userAddress = await user.getAddress();
    user2Address = await user2.getAddress();

    automate = await ethers.getContract("Automate");
    proxyModule = await ethers.getContract("ProxyModule");
    counter = await ethers.getContract("CounterWL");
    opsProxyFactory = await ethers.getContract("OpsProxyFactory");
    opsProxyImplementation = await ethers.getContract("OpsProxy");

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [GELATO],
    });

    executor = await ethers.getSigner(GELATO);

    // set-up
    await automate.setModule([Module.PROXY], [proxyModule.address]);

    // deploy proxy
    await opsProxyFactory.connect(user).deploy();

    // create task
    taskCreator = userAddress;
    execAddress = counter.address;
    execSelector = counter.interface.getSighash("increaseCount");
    execData = counter.interface.encodeFunctionData("increaseCount", [10]);
    moduleData = { modules: [Module.PROXY], args: ["0x"] };

    computeTaskId();

    await createTask(user);
  });

  it("create task", async () => {
    const taskIds = await automate.getTaskIdsByUser(userAddress);
    expect(taskIds).to.include(taskId);
  });

  it("create task - with proxy, eoa should own task", async () => {
    const [proxyAddress] = await opsProxyFactory.getProxyOf(userAddress);
    opsProxy = await ethers.getContractAt("OpsProxy", proxyAddress);
    moduleData = { ...moduleData, args: ["0x01"] };

    const createTaskData = automate.interface.encodeFunctionData("createTask", [
      execAddress,
      execData,
      moduleData,
      ZERO_ADD,
    ]);

    const executeCallData = opsProxy.interface.encodeFunctionData(
      "executeCall",
      [automate.address, createTaskData, 0]
    );

    await user.sendTransaction({
      to: opsProxy.address,
      data: executeCallData,
    });

    const taskIds = await automate.getTaskIdsByUser(userAddress);

    computeTaskId();

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

    expect(await opsProxy.ops()).to.be.eql(automate.address);
    expect(await opsProxy.owner()).to.be.eql(userAddress);
    expect(await opsProxyFactory.ownerOf(proxyAddress)).to.not.be.eql(ZERO_ADD);
  });

  it("proxy - properly initialized", async () => {
    expect(await opsProxyFactory.implementation()).to.be.eql(
      opsProxyImplementation.address
    );

    expect(await opsProxyImplementation.ops()).to.be.eql(automate.address);
    expect(await opsProxy.ops()).to.be.eql(automate.address);
    expect(await opsProxyImplementation.owner()).to.be.eql(ZERO_ADD);
    expect(await opsProxy.owner()).to.be.eql(userAddress);
  });

  it("proxy - cannot upgrade to not whitelisted implementation", async () => {
    const [proxyAddress] = await opsProxyFactory.getProxyOf(userAddress);
    const opsProxy: EIP173OpsProxy = await ethers.getContractAt(
      "EIP173OpsProxy",
      proxyAddress
    );

    await expect(opsProxy.connect(user).upgradeTo(ETH)).to.be.revertedWith(
      "Implementation not whitelisted"
    );
  });

  it("proxy - only owner can update implementation", async () => {
    const [proxyAddress] = await opsProxyFactory.getProxyOf(userAddress);
    const opsProxy: EIP173OpsProxy = await ethers.getContractAt(
      "EIP173OpsProxy",
      proxyAddress
    );

    await opsProxyFactory
      .connect(deployer)
      .updateWhitelistedImplementations(ETH, true);

    await opsProxy.connect(user).upgradeTo(ETH);
    const implementationAddress = ethers.utils.hexStripZeros(
      await ethers.provider.getStorageAt(
        opsProxy.address,
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
      )
    );

    expect(implementationAddress).to.be.eql(ETH);

    await expect(
      opsProxy.connect(user2).upgradeTo(ZERO_ADD)
    ).to.be.revertedWith("NOT_AUTHORIZED");
  });

  it("receive", async () => {
    const [proxyAddress] = await opsProxyFactory.getProxyOf(userAddress);

    const value = ethers.utils.parseEther("1");
    await deployer.sendTransaction({
      to: proxyAddress,
      value,
    });

    expect(await ethers.provider.getBalance(proxyAddress)).to.be.eq(value);
  });

  it("cancelTask - with proxy, eoa is owner of task", async () => {
    const [proxyAddress] = await opsProxyFactory.getProxyOf(userAddress);
    opsProxy = await ethers.getContractAt("OpsProxy", proxyAddress);

    const taskIds = await automate.getTaskIdsByUser(userAddress);

    const cancelTaskData = automate.interface.encodeFunctionData("cancelTask", [
      taskIds[0],
    ]);

    const executeCallData = opsProxy.interface.encodeFunctionData(
      "executeCall",
      [automate.address, cancelTaskData, 0]
    );

    await user.sendTransaction({ to: opsProxy.address, data: executeCallData });

    const taskIdsAfter = await automate.getTaskIdsByUser(userAddress);
    expect(taskIdsAfter).to.not.include(taskIds[0]);
  });

  it("exec - no whitelist", async () => {
    await expect(execute()).to.be.revertedWith("Counter: Not whitelisted");
  });

  it("exec - whitelist", async () => {
    // // whitelist proxy on counter
    await counter.connect(deployer).setWhitelist(opsProxy.address, true);
    expect(await counter.whitelisted(opsProxy.address)).to.be.true;

    const countBefore = await counter.count();
    await execute();
    const countAfter = await counter.count();
    expect(countAfter).to.be.gt(countBefore);
  });

  it("exec - batchExecuteCall", async () => {
    const counter2Factory = await ethers.getContractFactory("CounterWL");
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
    execAddress = opsProxy.address;
    moduleData = { modules: [Module.PROXY], args: ["0x"] };

    await createTask(user);

    const countBefore = await counter.count();
    const count2Before = await counter2.count();

    await execute();

    const countAfter = await counter.count();
    const count2After = await counter2.count();
    expect(countAfter).to.be.gt(countBefore);
    expect(count2After).to.be.gt(count2Before);
  });

  it("exec - execAddress is proxy", async () => {
    // // whitelist proxy on counter
    await counter.connect(deployer).setWhitelist(opsProxy.address, true);
    expect(await counter.whitelisted(opsProxy.address)).to.be.true;

    execAddress = opsProxy.address;
    execSelector = opsProxy.interface.getSighash("executeCall");
    const proxyExecData = opsProxy.interface.encodeFunctionData("executeCall", [
      counter.address,
      execData,
      0,
    ]);
    execData = proxyExecData;
    moduleData = { modules: [Module.PROXY], args: ["0x"] };

    await createTask(user);

    computeTaskId();

    const taskIds = await automate.getTaskIdsByUser(userAddress);
    expect(taskIds).to.include(taskId);

    const countBefore = await counter.count();
    await execute();
    const countAfter = await counter.count();
    expect(countAfter).to.be.gt(countBefore);
  });

  it("exec - execAddress is proxy, execData not encoded with `executeCall`", async () => {
    // // whitelist proxy on counter
    await counter.connect(deployer).setWhitelist(opsProxy.address, true);
    expect(await counter.whitelisted(opsProxy.address)).to.be.true;

    execAddress = opsProxy.address;
    moduleData = { modules: [Module.PROXY], args: ["0x"] };

    await createTask(user);

    computeTaskId();

    const taskIds = await automate.getTaskIdsByUser(userAddress);
    expect(taskIds).to.include(taskId);

    await expect(execute()).to.be.reverted;
  });

  it("exec - without proxy module initialised", async () => {
    // whitelist proxy on counter
    await counter.connect(deployer).setWhitelist(opsProxy.address, true);
    expect(await counter.whitelisted(opsProxy.address)).to.be.true;

    execAddress = opsProxy.address;
    execSelector = opsProxy.interface.getSighash("executeCall");
    const proxyExecData = opsProxy.interface.encodeFunctionData("executeCall", [
      counter.address,
      execData,
      0,
    ]);
    execData = proxyExecData;
    moduleData = { modules: [Module.PROXY], args: ["0x"] };

    await createTask(user);

    computeTaskId();

    const taskIds = await automate.getTaskIdsByUser(userAddress);
    expect(taskIds).to.include(taskId);

    const countBefore = await counter.count();
    await execute();
    const countAfter = await counter.count();
    expect(countAfter).to.be.gt(countBefore);
  });

  it("exec - without proxy module initialised, created by non proxy owner", async () => {
    execAddress = opsProxy.address;
    execSelector = opsProxy.interface.getSighash("executeCall");
    const proxyExecData = opsProxy.interface.encodeFunctionData("executeCall", [
      counter.address,
      execData,
      0,
    ]);
    execData = proxyExecData;
    moduleData = { modules: [], args: [] };
    taskCreator = user2Address;

    await expect(createTask(user2)).to.be.revertedWith(
      "Automate.preCreateTask: ProxyModule: Only owner of proxy"
    );
  });

  it("exec - with proxy module initialised, created by non proxy owner", async () => {
    execAddress = opsProxy.address;
    execSelector = opsProxy.interface.getSighash("executeCall");
    const proxyExecData = opsProxy.interface.encodeFunctionData("executeCall", [
      counter.address,
      execData,
      0,
    ]);
    execData = proxyExecData;
    moduleData = { modules: [Module.PROXY], args: ["0x"] };
    taskCreator = user2Address;

    await expect(createTask(user2)).to.be.revertedWith(
      "Automate.preCreateTask: ProxyModule: Only owner of proxy"
    );
  });

  const execute = async () => {
    const gelato1BalanceParam = getGelato1BalanceParam({});

    await automate
      .connect(executor)
      .exec1Balance(
        taskCreator,
        execAddress,
        execData,
        moduleData,
        gelato1BalanceParam,
        true
      );
  };

  const createTask = async (signer: Signer) => {
    await automate
      .connect(signer)
      .createTask(execAddress, execData, moduleData, ZERO_ADD);
  };

  const computeTaskId = () => {
    taskId = getTaskId(
      taskCreator,
      execAddress,
      execSelector,
      moduleData,
      ZERO_ADD
    );
  };
});
