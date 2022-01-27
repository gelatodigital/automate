import { expect } from "chai";
import { Signer } from "@ethersproject/abstract-signer";
import { abi as EIP173PROXY_ABI } from "hardhat-deploy/extendedArtifacts/EIP173Proxy.json";
import {
  Counter,
  Ops,
  TaskTreasury,
  TaskTreasuryUpgradable,
} from "../typechain";

import hre = require("hardhat");
const { ethers, deployments } = hre;
import * as dotenv from "dotenv";
const config = dotenv.config();
const ALCHEMY_ID = config?.parsed?.ALCHEMY_ID;

const GELATO = "0x3CACa7b48D0573D793d3b0279b5F0029180E83b6";
const OPS = "0xB3f5503f93d5Ef84b06993a1975B9D21B962892F";
const OLD_TASK_TREASURY = "0x66e2F69df68C8F56837142bE2E8C290EfE76DA9f";
const ETH = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

describe("TaskTreasuryUpgradable test", function () {
  this.timeout(0);

  let deployer: Signer;
  let treasuryOwner: Signer;
  let opsOwner: Signer;
  let user: Signer;
  let executor: Signer;
  let deployerAddress: string;
  let userAddress: string;
  let treasuryOwnerAddress: string;
  let opsOwnerAddress: string;

  let ops: Ops;
  let oldTreasury: TaskTreasury;
  let treasury: TaskTreasuryUpgradable;
  let counter: Counter;

  let execData: string;
  let execAddress: string;
  let resolverHash: string;

  beforeEach(async function () {
    // testing on mainnet block 14068500, where pokeme and treasury is deployed
    await setupFork();
    await deployments.fixture();
    [deployer, user] = await ethers.getSigners();
    deployerAddress = await deployer.getAddress();
    userAddress = await user.getAddress();

    oldTreasury = await ethers.getContractAt("TaskTreasury", OLD_TASK_TREASURY);
    treasury = await ethers.getContract("TaskTreasuryUpgradable");
    counter = await ethers.getContract("Counter");

    const opsFactory = await ethers.getContractFactory("Ops");
    ops = <Ops>await opsFactory.deploy(GELATO, treasury.address);
    const opsProxy = await ethers.getContractAt(EIP173PROXY_ABI, OPS);

    expect(await ops.taskTreasury()).to.be.eql(treasury.address);

    // get accounts
    treasuryOwnerAddress = await oldTreasury.owner();
    opsOwnerAddress = await opsProxy.owner();

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [treasuryOwnerAddress],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [opsOwnerAddress],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [GELATO],
    });

    executor = await ethers.getSigner(GELATO);
    treasuryOwner = await ethers.getSigner(treasuryOwnerAddress);
    opsOwner = await ethers.getSigner(opsOwnerAddress);

    // account set-up
    const value = ethers.utils.parseEther("10");
    await deployer.sendTransaction({
      to: treasuryOwnerAddress,
      value,
    });

    await oldTreasury
      .connect(user)
      .depositFunds(userAddress, ETH, value, { value });

    // upgrade opsProxy
    await opsProxy.connect(opsOwner).upgradeTo(ops.address);

    // whitelist
    oldTreasury.connect(treasuryOwner).addWhitelistedService(treasury.address);
    treasury.connect(deployer).addWhitelistedService(ops.address);

    // create task
    const execSelector = counter.interface.getSighash("increaseCount");
    execAddress = counter.address;
    execData = counter.interface.encodeFunctionData("increaseCount", [1]);

    const resolverAddress = ethers.constants.AddressZero;
    const resolverData = ethers.constants.HashZero;
    resolverHash = await ops.getResolverHash(resolverAddress, resolverData);

    await ops
      .connect(user)
      .createTask(execAddress, execSelector, resolverAddress, resolverData);
  });

  it("deposit by transfering ETH", async () => {
    const depositAmount = ethers.utils.parseEther("1");
    const oldBalanceBefore = await oldTreasury.userTokenBalance(
      userAddress,
      ETH
    );

    await user.sendTransaction({
      to: treasury.address,
      value: depositAmount,
    });

    const oldBalanceAfter = await oldTreasury.userTokenBalance(
      userAddress,
      ETH
    );
    const newBalanceAfter = await treasury.userTokenBalance(userAddress, ETH);

    expect(oldBalanceAfter).to.be.eq(ethers.BigNumber.from("0"));
    expect(newBalanceAfter).to.be.eql(oldBalanceBefore.add(depositAmount));
  });

  it("deposit when no funds in old treasury", async () => {
    const balance = await oldTreasury.userTokenBalance(userAddress, ETH);
    await oldTreasury.connect(user).withdrawFunds(userAddress, ETH, balance);

    expect(await oldTreasury.userTokenBalance(userAddress, ETH)).to.be.eq(
      ethers.BigNumber.from("0")
    );

    const depositAmount = ethers.utils.parseEther("1");

    await treasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });

    expect(await treasury.userTokenBalance(userAddress, ETH)).to.be.eql(
      depositAmount
    );
  });

  it("exec when no funds in old treasury", async () => {
    const balance = await oldTreasury.userTokenBalance(userAddress, ETH);
    await oldTreasury.connect(user).withdrawFunds(userAddress, ETH, balance);

    expect(await oldTreasury.userTokenBalance(userAddress, ETH)).to.be.eq(
      ethers.BigNumber.from("0")
    );

    const depositAmount = ethers.utils.parseEther("1");

    await treasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });

    const txFee = ethers.utils.parseEther("1");
    await ops
      .connect(executor)
      .exec(txFee, ETH, userAddress, true, resolverHash, execAddress, execData);

    const newBalanceAfter = await treasury.userTokenBalance(userAddress, ETH);

    expect(newBalanceAfter).to.be.eql(depositAmount.sub(txFee));
    expect(await treasury.userTokenBalance(deployerAddress, ETH)).to.be.eql(
      txFee
    );
  });

  it("deposit and migrate funds", async () => {
    const oldBalanceBefore = await oldTreasury.userTokenBalance(
      userAddress,
      ETH
    );

    const depositAmount = ethers.utils.parseEther("0.1");
    await treasury.connect(user).depositFunds(userAddress, ETH, depositAmount, {
      value: depositAmount,
    });

    const oldBalanceAfter = await oldTreasury.userTokenBalance(
      userAddress,
      ETH
    );
    const newBalanceAfter = await treasury.userTokenBalance(userAddress, ETH);

    expect(newBalanceAfter).to.be.eql(oldBalanceBefore.add(depositAmount));
    expect(oldBalanceAfter).to.be.eq(ethers.BigNumber.from("0"));
  });

  it("exec and migrate funds", async () => {
    const oldBalanceBefore = await oldTreasury.userTokenBalance(
      userAddress,
      ETH
    );

    const txFee = ethers.utils.parseEther("1");
    await ops
      .connect(executor)
      .exec(txFee, ETH, userAddress, true, resolverHash, execAddress, execData);

    const newBalanceAfter = await treasury.userTokenBalance(userAddress, ETH);
    const oldBalanceAfter = await oldTreasury.userTokenBalance(
      userAddress,
      ETH
    );

    expect(newBalanceAfter).to.be.eql(oldBalanceBefore.sub(txFee));
    expect(oldBalanceAfter).to.be.eq(ethers.BigNumber.from("0"));
    expect(await treasury.userTokenBalance(deployerAddress, ETH)).to.be.eql(
      txFee
    );
  });
});

const setupFork = async () => {
  await hre.network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
          blockNumber: 14068500,
        },
      },
    ],
  });
};
