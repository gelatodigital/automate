import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import {
  Automate,
  Counter,
  ProxyModule,
  ResolverModule,
  SingleExecModule,
  TaskTreasuryUpgradable,
  TimeModule,
  TriggerModule,
  Web3FunctionModule,
} from "../typechain";
import { Module, encodeTimeArgs, getTimeStampNow } from "./utils";
import hre = require("hardhat");
const { ethers, deployments } = hre;

const ZERO_ADD = ethers.constants.AddressZero;

describe("Automate deprecated test", function () {
  let automate: Automate;
  let taskTreasury: TaskTreasuryUpgradable;
  let counter: Counter;

  let resolverModule: ResolverModule;
  let timeModule: TimeModule;
  let proxyModule: ProxyModule;
  let singleExecModule: SingleExecModule;
  let web3FunctionModule: Web3FunctionModule;
  let triggerModule: TriggerModule;

  let user: Signer;

  beforeEach(async function () {
    await deployments.fixture();

    [, user] = await hre.ethers.getSigners();

    automate = await ethers.getContract("Automate");
    taskTreasury = await ethers.getContract("TaskTreasuryUpgradable");
    counter = await ethers.getContract("CounterTest");

    resolverModule = await ethers.getContract("ResolverModule");
    timeModule = await ethers.getContract("TimeModule");
    proxyModule = await ethers.getContract("ProxyModule");
    singleExecModule = await ethers.getContract("SingleExecModule");
    web3FunctionModule = await ethers.getContract("Web3FunctionModule");
    triggerModule = await ethers.getContract("TriggerModule");

    // set-up
    await taskTreasury.updateWhitelistedService(automate.address, true);
    await automate.setModule(
      [
        Module.RESOLVER,
        Module.TIME,
        Module.PROXY,
        Module.SINGLE_EXEC,
        Module.WEB3_FUNCTION,
        Module.TRIGGER,
      ],
      [
        resolverModule.address,
        timeModule.address,
        proxyModule.address,
        singleExecModule.address,
        web3FunctionModule.address,
        triggerModule.address,
      ]
    );
  });

  it("deprecated time module", async () => {
    const interval = 5 * 60;
    const startTime = await getTimeStampNow();
    const timeArgs = encodeTimeArgs(startTime, interval);

    const execSelector = counter.interface.getSighash("increaseCount");
    const moduleData = {
      modules: [Module.TIME, Module.PROXY],
      args: [timeArgs, "0x"],
    };

    await expect(
      automate
        .connect(user)
        .createTask(counter.address, execSelector, moduleData, ZERO_ADD)
    ).to.be.revertedWith("Automate._validModules: TIME is deprecated");
  });

  it("fallback - data", async () => {
    const data = "0x12345678";
    await expect(user.sendTransaction({ to: automate.address, data })).to.be
      .reverted;
  });

  it("fallback - value", async () => {
    const value = ethers.utils.parseEther("0.1");
    await expect(user.sendTransaction({ to: automate.address, value })).to.be
      .reverted;
  });

  it("fallback - value & data", async () => {
    const data = "0x12345678";
    const value = ethers.utils.parseEther("0.1");
    await expect(user.sendTransaction({ to: automate.address, value, data })).to
      .be.reverted;
  });
});
