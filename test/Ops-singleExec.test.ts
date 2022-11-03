import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import { getTaskId, Module, ModuleData } from "./utils";
import hre = require("hardhat");
const { ethers, deployments } = hre;
import {
  Ops,
  CounterTest,
  TaskTreasuryUpgradable,
  ProxyModule,
  SingleExecModule,
  TimeModule,
} from "../typechain";

const GELATO = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ZERO_ADD = ethers.constants.AddressZero;
const FEE = ethers.utils.parseEther("0.1");

describe("Ops SingleExec module test", function () {
  let ops: Ops;
  let counter: CounterTest;
  let taskTreasury: TaskTreasuryUpgradable;
  let singleExecModule: SingleExecModule;
  let proxyModule: ProxyModule;
  let timeModule: TimeModule;

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

    ops = await ethers.getContract("Ops");
    taskTreasury = await ethers.getContract("TaskTreasuryUpgradable");
    counter = await ethers.getContract("CounterTest");
    singleExecModule = await ethers.getContract("SingleExecModule");
    proxyModule = await ethers.getContract("ProxyModule");
    timeModule = await ethers.getContract("TimeModule");

    // set-up
    await taskTreasury.updateWhitelistedService(ops.address, true);
    await ops.setModule(
      [Module.TIME, Module.SINGLE_EXEC, Module.PROXY],
      [timeModule.address, singleExecModule.address, proxyModule.address]
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

    // create task
    execData = counter.interface.encodeFunctionData("increaseCount", [10]);
    moduleData = {
      modules: [Module.SINGLE_EXEC],
      args: ["0x"],
    };
    execSelector = counter.interface.getSighash("increaseCount");
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
    expect(taskIds).include(taskId);
  });

  it("create task - duplicate", async () => {
    await expect(
      ops
        .connect(user)
        .createTask(counter.address, execData, moduleData, ZERO_ADD)
    ).to.be.revertedWith("Ops.createTask: Duplicate task");
  });

  it("create task - duplicate with different args", async () => {
    moduleData = { ...moduleData, args: ["0x01"] };
    await ops
      .connect(user)
      .createTask(counter.address, execData, moduleData, ZERO_ADD);

    taskId = getTaskId(
      userAddress,
      counter.address,
      execSelector,
      moduleData,
      ZERO_ADD
    );

    const taskIds = await ops.getTaskIdsByUser(userAddress);
    expect(taskIds).include(taskId);
  });

  it("exec", async () => {
    const countBefore = await counter.count();

    await execute(true);

    const countAfter = await counter.count();
    expect(countAfter).to.be.gt(countBefore);

    const taskIds = await ops.getTaskIdsByUser(userAddress);
    expect(taskIds).not.include(taskId);
  });

  const execute = async (revertOnFailure: boolean) => {
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
