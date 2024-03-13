import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import {
  Automate,
  CounterResolver,
  CounterWL,
  OpsProxy,
  OpsProxyFactory,
  ProxyModule,
  ResolverModule,
  SingleExecModule,
  TriggerModule,
  Web3FunctionModule,
} from "../typechain";
import { Module, ModuleData, encodeResolverArgs, getTaskId } from "./utils";
import { getGelato1BalanceParam } from "./utils/1balance";
import hre = require("hardhat");
const { ethers, deployments } = hre;

const GELATO = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ZERO_ADD = ethers.constants.AddressZero;

describe("Automate multi module test", function () {
  let automate: Automate;
  let counter: CounterWL;
  let counterResolver: CounterResolver;
  let opsProxyFactory: OpsProxyFactory;
  let opsProxy: OpsProxy;

  let resolverModule: ResolverModule;
  let proxyModule: ProxyModule;
  let singleExecModule: SingleExecModule;
  let web3FunctionModule: Web3FunctionModule;
  let triggerModule: TriggerModule;

  let user: Signer;
  let userAddress: string;

  let executor: Signer;

  let taskId: string;
  let execSelector: string;
  let moduleData: ModuleData;
  let resolverArgs: string;

  beforeEach(async function () {
    await deployments.fixture();

    [, user] = await hre.ethers.getSigners();
    userAddress = await user.getAddress();

    automate = await ethers.getContract("Automate");
    counter = await ethers.getContract("CounterWL");
    counterResolver = await ethers.getContract("CounterResolver");
    opsProxyFactory = await ethers.getContract("OpsProxyFactory");

    resolverModule = await ethers.getContract("ResolverModule");
    proxyModule = await ethers.getContract("ProxyModule");
    singleExecModule = await ethers.getContract("SingleExecModule");
    web3FunctionModule = await ethers.getContract("Web3FunctionModule");
    triggerModule = await ethers.getContract("TriggerModule");

    // set-up
    await automate.setModule(
      [
        Module.RESOLVER,
        Module.PROXY,
        Module.SINGLE_EXEC,
        Module.WEB3_FUNCTION,
        Module.TRIGGER,
      ],
      [
        resolverModule.address,
        proxyModule.address,
        singleExecModule.address,
        web3FunctionModule.address,
        triggerModule.address,
      ]
    );

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [GELATO],
    });
    executor = ethers.provider.getSigner(GELATO);

    // deploy proxy
    await opsProxyFactory.connect(user).deploy();

    // create task
    const resolverData =
      counterResolver.interface.encodeFunctionData("checker");
    resolverArgs = encodeResolverArgs(counterResolver.address, resolverData);

    execSelector = counter.interface.getSighash("increaseCount");
    moduleData = {
      modules: [Module.RESOLVER, Module.PROXY, Module.SINGLE_EXEC],
      args: [resolverArgs, "0x", "0x"],
    };

    taskId = getTaskId(
      userAddress,
      counter.address,
      execSelector,
      moduleData,
      ZERO_ADD
    );

    await automate
      .connect(user)
      .createTask(counter.address, execSelector, moduleData, ZERO_ADD);

    const [proxyAddress] = await opsProxyFactory.getProxyOf(userAddress);
    opsProxy = await ethers.getContractAt("OpsProxy", proxyAddress);

    // whitelist proxy on counter
    await counter.setWhitelist(opsProxy.address, true);
    expect(await counter.whitelisted(opsProxy.address)).to.be.true;
  });

  it("getTaskId", async () => {
    const thisTaskId = await automate.getTaskId(
      userAddress,
      counter.address,
      execSelector,
      moduleData,
      ZERO_ADD
    );

    const expectedTaskId = taskId;

    expect(thisTaskId).to.be.eql(expectedTaskId);
  });

  it("createTask - task created", async () => {
    const taskIds = await automate.getTaskIdsByUser(userAddress);
    expect(taskIds).include(taskId);
  });

  it("createTask - wrong module order", async () => {
    moduleData = {
      modules: [Module.RESOLVER, Module.SINGLE_EXEC, Module.PROXY],
      args: [resolverArgs, "0x", "0x"],
    };

    await expect(
      automate
        .connect(user)
        .createTask(counter.address, execSelector, moduleData, ZERO_ADD)
    ).to.be.revertedWith("Automate._validModules: Asc only");
  });

  it("createTask - duplicate modules", async () => {
    moduleData = {
      modules: [Module.RESOLVER, Module.RESOLVER, Module.PROXY],
      args: [resolverArgs, resolverArgs, "0x"],
    };

    await expect(
      automate
        .connect(user)
        .createTask(counter.address, execSelector, moduleData, ZERO_ADD)
    ).to.be.revertedWith("Automate._validModules: Asc only");
  });

  it("createTask - only one resolver", async () => {
    moduleData = {
      modules: [Module.RESOLVER, Module.PROXY, Module.WEB3_FUNCTION],
      args: ["0x", "0x", "0x"],
    };

    await expect(
      automate.createTask(counter.address, execSelector, moduleData, ZERO_ADD)
    ).to.be.revertedWith(
      "Automate._validModules: Only RESOLVER or WEB3_FUNCTION"
    );
  });

  it("createTask - no modules", async () => {
    moduleData = {
      modules: [],
      args: [],
    };

    await expect(
      automate.createTask(counter.address, execSelector, moduleData, ZERO_ADD)
    ).to.be.revertedWith("Automate._validModules: PROXY is required");
  });

  it("createTask - only proxy", async () => {
    await counter.setWhitelist(automate.address, true);
    expect(await counter.whitelisted(automate.address)).to.be.true;
    moduleData = { modules: [Module.PROXY], args: ["0x"] };
    const execData = counter.interface.encodeFunctionData("increaseCount", [
      10,
    ]);

    await automate
      .connect(user)
      .createTask(counter.address, execData, moduleData, ZERO_ADD);

    const countBefore = await counter.count();

    await execute(true);

    const countAfter = await counter.count();
    expect(countAfter).to.be.gt(countBefore);
  });

  it("exec1Balance", async () => {
    const countBefore = await counter.count();
    const [, execData] = await counterResolver.checker();

    const gelato1BalanceParam = getGelato1BalanceParam({});

    await expect(
      automate
        .connect(executor)
        .exec1Balance(
          userAddress,
          counter.address,
          execData,
          moduleData,
          gelato1BalanceParam,
          true
        )
    )
      .to.emit(automate, "LogUseGelato1Balance")
      .withArgs(
        gelato1BalanceParam.sponsor,
        counter.address,
        gelato1BalanceParam.feeToken,
        gelato1BalanceParam.oneBalanceChainId,
        gelato1BalanceParam.nativeToFeeTokenXRateNumerator,
        gelato1BalanceParam.nativeToFeeTokenXRateDenominator,
        gelato1BalanceParam.correlationId
      );

    const countAfter = await counter.count();

    expect(countAfter).to.be.gt(countBefore);
  });

  it("execBypassModule", async () => {
    const countBefore = await counter.count();
    const [, execData] = await counterResolver.checker();

    const dmsExecData = opsProxy.interface.encodeFunctionData("executeCall", [
      counter.address,
      execData,
      0,
    ]);

    await automate
      .connect(executor)
      .execBypassModule(
        userAddress,
        opsProxy.address,
        taskId,
        ethers.constants.HashZero,
        dmsExecData,
        true,
        false
      );

    const countAfter = await counter.count();

    expect(countAfter).to.be.gt(countBefore);
  });

  const execute = async (revertOnFailure: boolean) => {
    const [, execData] = await counterResolver.checker();

    const gelato1BalanceParam = getGelato1BalanceParam({});

    await automate
      .connect(executor)
      .exec1Balance(
        userAddress,
        counter.address,
        execData,
        moduleData,
        gelato1BalanceParam,
        revertOnFailure
      );
  };
});
