/* eslint-disable @typescript-eslint/no-explicit-any */
import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import hre = require("hardhat");
const { ethers, deployments } = hre;
import {
  Automate,
  TaskTreasuryUpgradable,
  CounterTest,
  ProxyModule,
  TimeModule,
} from "../typechain";
import {
  encodeTimeArgs,
  fastForwardTime,
  getTaskId,
  getTimeStampNow,
  Module,
  ModuleData,
} from "./utils";

const GELATO = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ZERO_ADD = ethers.constants.AddressZero;

const INTERVAL = 7 * 60;
const FEE = ethers.utils.parseEther("0.1");

describe("Automate Time module test", function () {
  this.timeout(0);

  let automate: Automate;
  let taskTreasury: TaskTreasuryUpgradable;
  let counter: CounterTest;
  let timeModule: TimeModule;
  let proxyModule: ProxyModule;

  let user: Signer;
  let userAddress: string;

  let executor: any;
  let executorAddress: string;

  let taskId: string;
  let execData: string;
  let moduleData: ModuleData;

  beforeEach(async function () {
    await deployments.fixture();

    [, user] = await ethers.getSigners();
    userAddress = await user.getAddress();

    automate = await ethers.getContract("Automate");
    taskTreasury = await ethers.getContract("TaskTreasuryUpgradable");
    counter = await ethers.getContract("CounterTest");
    timeModule = await ethers.getContract("TimeModule");
    proxyModule = await ethers.getContract("ProxyModule");

    // set-up
    await taskTreasury.updateWhitelistedService(automate.address, true);
    await automate.setModule(
      [Module.TIME, Module.PROXY],
      [timeModule.address, proxyModule.address]
    );

    const depositAmount = ethers.utils.parseEther("1");
    await taskTreasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });

    executorAddress = GELATO;
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [executorAddress],
    });
    executor = ethers.provider.getSigner(executorAddress);

    // create task
    const execSelector = counter.interface.getSighash("increaseCount");
    execData = counter.interface.encodeFunctionData("increaseCount", [100]);
    const startTime = (await getTimeStampNow()) + INTERVAL;

    const modules: Module[] = [Module.TIME];
    const timeArgs = encodeTimeArgs(startTime, INTERVAL);
    moduleData = { modules, args: [timeArgs] };

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

  it("time not elapsed", async () => {
    await expect(execute()).to.be.revertedWith(
      "Automate.preExecCall: TimeModule: Too early"
    );
  });

  it("time elapsed", async () => {
    const countBefore = await counter.count();

    await fastForwardTime(INTERVAL);
    await execute();

    const countAfter = await counter.count();
    expect(countAfter).to.be.gt(countBefore);

    // executable in Counter but not in Time module
    await fastForwardTime(3 * 60);
    await expect(execute()).to.be.revertedWith(
      "Automate.preExecCall: TimeModule: Too early"
    );
  });

  it("skip multiple intervals", async () => {
    const countBefore = await counter.count();

    await fastForwardTime(10 * INTERVAL);
    await execute();

    const countAfter = await counter.count();
    expect(countAfter).to.be.gt(countBefore);

    // executable in Counter but not in Time module
    await fastForwardTime(3 * 60);
    await expect(execute()).to.be.revertedWith(
      "Automate.preExecCall: TimeModule: Too early"
    );

    const time = await automate.timedTask(taskId);
    expect(time.nextExec).to.be.gt(await getTimeStampNow());
  });

  it("set module", async () => {
    await expect(
      automate.connect(user).setModule([Module.PROXY], [ZERO_ADD])
    ).to.be.revertedWith("NOT_AUTHORIZED");
  });

  const execute = async () => {
    await automate
      .connect(executor)
      .exec(
        userAddress,
        counter.address,
        execData,
        moduleData,
        FEE,
        ETH,
        true,
        true
      );
  };
});
