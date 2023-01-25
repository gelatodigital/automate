import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import { Module, ModuleData } from "./utils";
import hre = require("hardhat");
const { ethers, deployments } = hre;
import {
  Ops,
  Counter,
  TaskTreasuryUpgradable,
  OResolverModule,
  ProxyModule,
  ResolverModule,
  Web3FunctionModule,
} from "../typechain";

const GELATO = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ZERO_ADD = ethers.constants.AddressZero;

describe("Ops OResolver module test", function () {
  let ops: Ops;
  let counter: Counter;
  let treasury: TaskTreasuryUpgradable;
  let resolverModule: ResolverModule;
  let proxyModule: ProxyModule;
  let oResolverModule: OResolverModule;
  let web3FunctionModule: Web3FunctionModule;

  let user: Signer;
  let userAddress: string;

  let execSelector: string;
  let moduleData: ModuleData;

  beforeEach(async function () {
    await deployments.fixture();

    [, user] = await hre.ethers.getSigners();
    userAddress = await user.getAddress();

    ops = await ethers.getContract("Ops");
    treasury = await ethers.getContract("TaskTreasuryUpgradable");
    counter = await ethers.getContract("Counter");
    resolverModule = await ethers.getContract("ResolverModule");
    proxyModule = await ethers.getContract("ProxyModule");
    oResolverModule = await ethers.getContract("OResolverModule");
    web3FunctionModule = await ethers.getContract("Web3FunctionModule");

    // set-up
    await treasury.updateWhitelistedService(ops.address, true);
    await ops.setModule(
      [Module.RESOLVER, Module.PROXY, Module.ORESOLVER, Module.WEB3_FUNCTION],
      [
        resolverModule.address,
        proxyModule.address,
        oResolverModule.address,
        web3FunctionModule.address,
      ]
    );

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [GELATO],
    });

    // deposit funds
    const depositAmount = ethers.utils.parseEther("1");
    await treasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });

    execSelector = counter.interface.getSighash("increaseCount");
    moduleData = {
      modules: [Module.ORESOLVER],
      args: ["0x", "0x"],
    };
  });

  it("createTask - whitelisted", async () => {
    await oResolverModule.setWhitelist([userAddress], true);
    const encoded = await oResolverModule.encodeModuleArg("ipfsHash", "0x");

    moduleData = {
      modules: [Module.ORESOLVER],
      args: [encoded],
    };

    await ops
      .connect(user)
      .createTask(counter.address, execSelector, moduleData, ZERO_ADD);
  });

  it("createTask - not whitelisted", async () => {
    const encoded = await oResolverModule.encodeModuleArg("ipfsHash", "0x");

    moduleData = {
      modules: [Module.ORESOLVER],
      args: [encoded],
    };

    await expect(
      ops
        .connect(user)
        .createTask(counter.address, execSelector, moduleData, ZERO_ADD)
    ).to.be.revertedWith("Ops.onCreateTask: OResolverModule: Not whitelisted");
  });

  it("createTask - only one resolver (RESOLVER & ORESOLVER)", async () => {
    moduleData = {
      modules: [Module.RESOLVER, Module.ORESOLVER],
      args: ["0x", "0x"],
    };

    await expect(
      ops.createTask(counter.address, execSelector, moduleData, ZERO_ADD)
    ).to.be.revertedWith("Ops._validModules: Only one resolver");
  });

  it("createTask - only one resolver (ORESOLVER & WEB3_FUNCTION)", async () => {
    await oResolverModule.setWhitelist([userAddress], true);

    moduleData = {
      modules: [Module.ORESOLVER, Module.WEB3_FUNCTION],
      args: ["0x", "0x"],
    };

    await expect(
      ops
        .connect(user)
        .createTask(counter.address, execSelector, moduleData, ZERO_ADD)
    ).to.be.revertedWith("Ops._validModules: Only one resolver");
  });
});
