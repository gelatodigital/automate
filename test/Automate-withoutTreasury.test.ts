import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import {
  Automate,
  CounterTestWT,
  IGelato,
  ProxyModule,
  SingleExecModule,
} from "../typechain";
import { Module, ModuleData, getTaskId } from "./utils";
import hre = require("hardhat");
const { ethers, deployments } = hre;

const GELATO = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const FEE = ethers.utils.parseEther("0.1");

describe("Automate Without 1Balance test", function () {
  let automate: Automate;
  let counterWT: CounterTestWT;
  let singleExecModule: SingleExecModule;
  let proxyModule: ProxyModule;
  let feeCollector: string;

  let user: Signer;
  let userAddress: string;

  let executor: Signer;

  let taskId: string;
  let execData: string;
  let execSelector: string;
  let moduleData: ModuleData;

  beforeEach(async function () {
    await deployments.fixture();

    const gelato = await ethers.getContractAt<IGelato>("IGelato", GELATO);
    feeCollector = await gelato.feeCollector();

    [, user] = await hre.ethers.getSigners();
    userAddress = await user.getAddress();

    automate = await ethers.getContract("Automate");
    singleExecModule = await ethers.getContract("SingleExecModule");
    proxyModule = await ethers.getContract("ProxyModule");

    // set-up
    await automate.setModule(
      [Module.SINGLE_EXEC, Module.PROXY],
      [singleExecModule.address, proxyModule.address]
    );

    // Automate Proxy module need to be set-up before being able to deploy CounterTestWT
    const counterWtFactory = await ethers.getContractFactory("CounterTestWT");
    counterWT = <CounterTestWT>(
      await counterWtFactory.deploy(automate.address, userAddress)
    );

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [GELATO],
    });
    executor = ethers.provider.getSigner(GELATO);

    // create task
    execData = counterWT.interface.encodeFunctionData("increaseCount", [10]);
    moduleData = {
      modules: [Module.PROXY, Module.SINGLE_EXEC],
      args: ["0x", "0x"],
    };
    execSelector = counterWT.interface.getSighash("increaseCount");
    taskId = getTaskId(
      userAddress,
      counterWT.address,
      execSelector,
      moduleData,
      ETH
    );

    await automate
      .connect(user)
      .createTask(counterWT.address, execData, moduleData, ETH);

    // Topup Counter contract funds
    await user.sendTransaction({
      to: counterWT.address,
      value: ethers.utils.parseEther("1"),
    });
  });

  it("create task", async () => {
    const taskIds = await automate.getTaskIdsByUser(userAddress);
    expect(taskIds).include(taskId);
  });

  it("create task - duplicate", async () => {
    await expect(
      automate
        .connect(user)
        .createTask(counterWT.address, execData, moduleData, ETH)
    ).to.be.revertedWith("Automate.createTask: Duplicate task");
  });

  it("exec", async () => {
    const countBefore = await counterWT.count();

    await execute(true);

    const countAfter = await counterWT.count();
    expect(countAfter).to.be.gt(countBefore);

    const taskIds = await automate.getTaskIdsByUser(userAddress);
    expect(taskIds).to.not.include(taskId);
  });

  it("execBypassModuleSyncFee", async () => {
    const countBefore = await counterWT.count();

    await automate
      .connect(executor)
      .execBypassModuleSyncFee(
        userAddress,
        counterWT.address,
        taskId,
        FEE,
        ETH,
        execData,
        false,
        false
      );

    const countAfter = await counterWT.count();
    expect(countAfter).to.be.gt(countBefore);

    const taskIds = await automate.getTaskIdsByUser(userAddress);
    expect(taskIds).to.include(taskId);
  });

  it("execBypassModuleSyncFee - singleExec", async () => {
    const countBefore = await counterWT.count();

    await automate
      .connect(executor)
      .execBypassModuleSyncFee(
        userAddress,
        counterWT.address,
        taskId,
        FEE,
        ETH,
        execData,
        false,
        true
      );

    const countAfter = await counterWT.count();
    expect(countAfter).to.be.gt(countBefore);

    const taskIds = await automate.getTaskIdsByUser(userAddress);
    expect(taskIds).to.not.include(taskId);
  });

  it("send funds to feeCollector", async () => {
    const balanceBefore = await ethers.provider.getBalance(feeCollector);

    await execute(true);

    const balanceAfter = await ethers.provider.getBalance(feeCollector);
    expect(balanceAfter).to.be.gt(balanceBefore);
  });

  const execute = async (revertOnFailure: boolean) => {
    await automate
      .connect(executor)
      .exec(
        userAddress,
        counterWT.address,
        execData,
        moduleData,
        FEE,
        ETH,
        revertOnFailure
      );
  };
});
