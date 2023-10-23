import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import {
  Automate,
  Counter,
  ProxyModule,
  ResolverModule,
  SingleExecModule,
  TriggerModule,
  Web3FunctionModule,
} from "../typechain";
import { Module, encodeTimeArgs, getTimeStampNow } from "./utils";
import hre = require("hardhat");
const { ethers, deployments } = hre;

const ZERO_ADD = ethers.constants.AddressZero;

describe("Automate deprecated test", function () {
  let automate: Automate;
  let counter: Counter;

  let resolverModule: ResolverModule;
  let proxyModule: ProxyModule;
  let singleExecModule: SingleExecModule;
  let web3FunctionModule: Web3FunctionModule;
  let triggerModule: TriggerModule;

  let user: Signer;

  beforeEach(async function () {
    await deployments.fixture();

    [, user] = await hre.ethers.getSigners();

    automate = await ethers.getContract("Automate");
    counter = await ethers.getContract("CounterTest");

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
  });

  it("deprecated time module", async () => {
    const interval = 5 * 60;
    const startTime = await getTimeStampNow();
    const timeArgs = encodeTimeArgs(startTime, interval);

    const execSelector = counter.interface.getSighash("increaseCount");
    const moduleData = {
      modules: [Module.DEPRECATED_TIME, Module.PROXY],
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
