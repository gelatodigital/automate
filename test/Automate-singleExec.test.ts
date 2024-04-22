import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import {
  Automate,
  CounterTest,
  ProxyModule,
  SingleExecModule,
} from "../typechain";
import { Module, ModuleData, getTaskId } from "./utils";
import { getGelato1BalanceParam } from "./utils/1balance";
import hre = require("hardhat");
const { ethers, deployments } = hre;

const GELATO = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ZERO_ADD = ethers.constants.AddressZero;

describe("Automate SingleExec module test", function () {
  let automate: Automate;
  let counter: CounterTest;
  let singleExecModule: SingleExecModule;
  let proxyModule: ProxyModule;

  let user: Signer;
  let userAddress: string;

  let executor: Signer;

  let taskId: string;
  let execData: string;
  let execSelector: string;
  let moduleData: ModuleData;

  beforeEach(async function () {
    await deployments.fixture();

    [, user] = await hre.ethers.getSigners();
    userAddress = await user.getAddress();

    automate = await ethers.getContract("Automate");
    counter = await ethers.getContract("CounterTest");
    singleExecModule = await ethers.getContract("SingleExecModule");
    proxyModule = await ethers.getContract("ProxyModule");

    // set-up
    await automate.setModule(
      [Module.SINGLE_EXEC, Module.PROXY],
      [singleExecModule.address, proxyModule.address]
    );

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [GELATO],
    });
    executor = ethers.provider.getSigner(GELATO);

    // create task
    execData = counter.interface.encodeFunctionData("increaseCount", [10]);
    moduleData = {
      modules: [Module.PROXY, Module.SINGLE_EXEC],
      args: ["0x", "0x"],
    };
    execSelector = counter.interface.getSighash("increaseCount");
    taskId = getTaskId(
      userAddress,
      counter.address,
      execSelector,
      moduleData,
      ZERO_ADD
    );

    await automate
      .connect(user)
      .createTask(counter.address, execData, moduleData, ZERO_ADD);
  });

  it("create task", async () => {
    const taskIds = await automate.getTaskIdsByUser(userAddress);
    expect(taskIds).include(taskId);
  });

  it("create task - duplicate", async () => {
    await expect(
      automate
        .connect(user)
        .createTask(counter.address, execData, moduleData, ZERO_ADD)
    ).to.be.revertedWith("Automate.createTask: Duplicate task");
  });

  it("create task - duplicate with different args", async () => {
    moduleData = { ...moduleData, args: ["0x01"] };
    await automate
      .connect(user)
      .createTask(counter.address, execData, moduleData, ZERO_ADD);

    taskId = getTaskId(
      userAddress,
      counter.address,
      execSelector,
      moduleData,
      ZERO_ADD
    );

    const taskIds = await automate.getTaskIdsByUser(userAddress);
    expect(taskIds).include(taskId);
  });

  it("exec", async () => {
    const countBefore = await counter.count();

    await execute(true);

    const countAfter = await counter.count();
    expect(countAfter).to.be.gt(countBefore);

    const taskIds = await automate.getTaskIdsByUser(userAddress);
    expect(taskIds).not.include(taskId);
  });

  it("execBypassModule", async () => {
    const countBefore = await counter.count();

    await automate
      .connect(executor)
      .execBypassModule(
        userAddress,
        counter.address,
        taskId,
        ethers.constants.HashZero,
        execData,
        true,
        true
      );

    const countAfter = await counter.count();
    expect(countAfter).to.be.gt(countBefore);

    const taskIds = await automate.getTaskIdsByUser(userAddress);
    expect(taskIds).not.include(taskId);
  });

  const execute = async (revertOnFailure: boolean) => {
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
