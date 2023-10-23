import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import {
  Automate,
  CounterTest,
  ProxyModule,
  ResolverModule,
} from "../typechain";
import { Module, ModuleData, encodeResolverArgs, getTaskId } from "./utils";
import { getGelato1BalanceParam } from "./utils/1balance";
import hre = require("hardhat");
const { ethers, deployments } = hre;

const GELATO = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ZERO_ADD = ethers.constants.AddressZero;

describe("Automate Resolver module test", function () {
  let automate: Automate;
  let counter: CounterTest;
  let resolverModule: ResolverModule;
  let proxyModule: ProxyModule;

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

    automate = await ethers.getContract("Automate");
    counter = await ethers.getContract("CounterTest");
    resolverModule = await ethers.getContract("ResolverModule");
    proxyModule = await ethers.getContract("ProxyModule");

    // set-up
    await automate.setModule(
      [Module.RESOLVER, Module.PROXY],
      [resolverModule.address, proxyModule.address]
    );

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [GELATO],
    });
    executor = ethers.provider.getSigner(GELATO);

    // create task
    const resolverData = counter.interface.encodeFunctionData("checker");
    const resolverArgs = encodeResolverArgs(counter.address, resolverData);
    execSelector = counter.interface.getSighash("increaseCount");
    moduleData = {
      modules: [Module.RESOLVER, Module.PROXY],
      args: [resolverArgs, "0x"],
    };
    taskId = taskId = getTaskId(
      userAddress,
      counter.address,
      execSelector,
      moduleData,
      ZERO_ADD
    );

    await automate
      .connect(user)
      .createTask(counter.address, execSelector, moduleData, ZERO_ADD);
  });

  it("create task", async () => {
    const taskIds = await automate.getTaskIdsByUser(userAddress);
    expect(taskIds).include(taskId);
  });

  it("create task - duplicate", async () => {
    await expect(
      automate
        .connect(user)
        .createTask(counter.address, execSelector, moduleData, ZERO_ADD)
    ).to.be.revertedWith("Automate.createTask: Duplicate task");
  });

  it("cancel non existant task", async () => {
    await automate.connect(user).cancelTask(taskId);

    await expect(automate.connect(user).cancelTask(taskId)).to.be.revertedWith(
      "Automate.cancelTask: Task not found"
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
    execSelector = counter.interface.getSighash("increaseCountReverts");
    const resolverData = counter.interface.encodeFunctionData("checkerReverts");
    const resolverArgs = encodeResolverArgs(counter.address, resolverData);
    moduleData = {
      modules: [Module.RESOLVER, Module.PROXY],
      args: [resolverArgs, "0x"],
    };

    await automate
      .connect(user)
      .createTask(counter.address, execSelector, moduleData, ZERO_ADD);

    await expect(execute(true, true)).to.be.revertedWith(
      "Automate.exec: OpsProxy.executeCall: Counter: reverts"
    );

    // will not fail on-chain
    await execute(false, true);

    const count3 = await counter.count();
    expect(count3).to.be.eql(count2);
  });

  it("getTaskIdsByUser", async () => {
    // create 2nd task
    await automate
      .connect(user)
      .createTask(counter.address, execSelector, moduleData, ETH);
    const taskIds = await automate.getTaskIdsByUser(userAddress);

    expect(taskIds.length).to.be.eql(2);
    expect(taskIds).include(taskId);
  });

  const execute = async (revertOnFailure: boolean, callReverts = false) => {
    const [, execData] = callReverts
      ? await counter.checkerReverts()
      : await counter.checker();

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
