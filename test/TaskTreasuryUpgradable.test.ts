import { expect } from "chai";
import { Signer } from "@ethersproject/abstract-signer";
import { abi as EIP173PROXY_ABI } from "hardhat-deploy/extendedArtifacts/EIP173Proxy.json";
import { BigNumber } from "ethereum-waffle/node_modules/ethers";
import { getTokenFromFaucet } from "./helpers";
import {
  IERC20,
  Counter,
  Ops,
  TaskTreasury,
  TaskTreasuryUpgradable,
} from "../typechain";

import hre = require("hardhat");
const { ethers, deployments } = hre;

const GELATO = "0x3CACa7b48D0573D793d3b0279b5F0029180E83b6";
const OPS_173PROXY = "0xB3f5503f93d5Ef84b06993a1975B9D21B962892F";
const OLD_TASK_TREASURY = "0x66e2F69df68C8F56837142bE2E8C290EfE76DA9f";
const ETH = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

describe("TaskTreasuryUpgradable test", function () {
  this.timeout(0);

  let deployer: Signer;
  let deployerAddress: string;

  let user: Signer;
  let userAddress: string;

  let user2: Signer;
  let user2Address: string;

  let executor: Signer;

  let ops: Ops;
  let oldTreasury: TaskTreasury;
  let treasury: TaskTreasuryUpgradable;
  let counter: Counter;
  let dai: IERC20;

  let execData: string;
  let execAddress: string;
  let resolverHash: string;

  beforeEach(async function () {
    await deployments.fixture();
    [deployer, user, user2] = await ethers.getSigners();
    deployerAddress = await deployer.getAddress();
    userAddress = await user.getAddress();
    user2Address = await user2.getAddress();

    oldTreasury = await ethers.getContractAt("TaskTreasury", OLD_TASK_TREASURY);
    treasury = await ethers.getContract("TaskTreasuryUpgradable");
    dai = await ethers.getContractAt("IERC20", DAI);

    const counterFactory = await ethers.getContractFactory("Counter");
    counter = <Counter>await counterFactory.deploy(OPS_173PROXY);

    const opsFactory = await ethers.getContractFactory("Ops");
    const opsImplementation = await opsFactory.deploy(GELATO, treasury.address);
    const ops173Proxy = await ethers.getContractAt(
      EIP173PROXY_ABI,
      OPS_173PROXY
    );

    // get accounts
    const treasuryOwnerAddress = await oldTreasury.owner();
    const opsOwnerAddress = await ops173Proxy.owner();

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
    const treasuryOwner = await ethers.getSigner(treasuryOwnerAddress);
    const opsOwner = await ethers.getSigner(opsOwnerAddress);

    // account set-up
    const value = ethers.utils.parseEther("100");
    await getTokenFromFaucet(DAI, userAddress, value);
    await getTokenFromFaucet(DAI, user2Address, value);
    await deployer.sendTransaction({
      to: treasuryOwnerAddress,
      value,
    });

    // upgrade opsProxy
    await ops173Proxy.connect(opsOwner).upgradeTo(opsImplementation.address);
    ops = await ethers.getContractAt("Ops", OPS_173PROXY);

    // whitelist
    oldTreasury.connect(treasuryOwner).addWhitelistedService(treasury.address);
    treasury.connect(deployer).updateWhitelistedService(ops.address, true);

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

  it("ops proxy should have correct treasury address", async () => {
    expect(await ops.taskTreasury()).to.be.eql(treasury.address);
  });

  it("deposit ETH", async () => {
    const depositAmount = ethers.utils.parseEther("5");

    await depositEth(user, depositAmount);
  });

  it("deposit DAI", async () => {
    const depositAmount = ethers.utils.parseEther("5");

    await depositDai(user, depositAmount);
  });

  it("multiple users deposit ETH", async () => {
    const depositAmount1 = ethers.utils.parseEther("2");
    const depositAmount2 = ethers.utils.parseEther("4");

    await depositEth(user, depositAmount1);
    await depositEth(user2, depositAmount2);
  });

  it("multiple users deposit DAI", async () => {
    const depositAmount1 = ethers.utils.parseEther("2");
    const depositAmount2 = ethers.utils.parseEther("3");

    await depositDai(user, depositAmount1);
    await depositDai(user2, depositAmount2);
  });

  it("multiple users deposit then withdraw eth", async () => {
    const depositAmount1 = ethers.utils.parseEther("10");
    const depositAmount2 = ethers.utils.parseEther("12");

    await depositEth(user, depositAmount1);
    await depositEth(user2, depositAmount2);

    const withdrawAmount = ethers.utils.parseEther("3");

    await withdraw(user, "eth", withdrawAmount);
    await withdraw(user2, "eth", withdrawAmount);
  });

  it("multiple users deposit then withdraw dai", async () => {
    const depositAmount1 = ethers.utils.parseEther("10");
    const depositAmount2 = ethers.utils.parseEther("12");

    await depositDai(user, depositAmount1);
    await depositDai(user2, depositAmount2);

    const withdrawAmount = ethers.utils.parseEther("3");

    await withdraw(user, "dai", withdrawAmount);
    await withdraw(user2, "dai", withdrawAmount);
  });

  it("useFunds in ETH - no funds in old treasury", async () => {
    const depositAmount = ethers.utils.parseEther("8");
    const txFee = ethers.utils.parseEther("0.5");

    await depositEth(user, depositAmount);

    const expectedTreasuryBalance = depositAmount.sub(txFee);
    await execute("eth", txFee, expectedTreasuryBalance);
  });

  it("useFunds in ETH - funds in old treasury partially covers txFee", async () => {
    const depositAmount = ethers.utils.parseEther("1");
    const txFee = ethers.utils.parseEther("1.5");

    await depositEth(user, depositAmount);
    await depositEth(user2, depositAmount);
    await oldTreasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, {
        value: depositAmount,
      });

    const expectedTreasuryBalance = depositAmount.mul(2).sub(txFee);
    await execute("eth", txFee, expectedTreasuryBalance);
  });

  it("useFunds in ETH - funds in old treasury covers txFee", async () => {
    const depositAmount = ethers.utils.parseEther("1");
    const txFee = ethers.utils.parseEther("1");

    await depositEth(user, depositAmount);
    await depositEth(user2, depositAmount);
    await oldTreasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, {
        value: depositAmount,
      });

    const expectedTreasuryBalance = depositAmount.mul(2).sub(txFee);
    await execute("eth", txFee, expectedTreasuryBalance);
  });

  it("useFunds in DAI - no funds in old treasury", async () => {
    const depositAmount = ethers.utils.parseEther("8");
    const txFee = ethers.utils.parseEther("0.5");

    await depositDai(user, depositAmount);
    await depositDai(user2, depositAmount);

    const expectedTreasuryBalance = depositAmount.sub(txFee);
    await execute("dai", txFee, expectedTreasuryBalance);
  });

  it("useFunds in DAI - funds in old treasury partially covers txFee", async () => {
    const depositAmount = ethers.utils.parseEther("1");
    const txFee = ethers.utils.parseEther("1.5");

    await depositDai(user, depositAmount);
    await depositDai(user2, depositAmount);
    await dai.connect(user).approve(oldTreasury.address, depositAmount);
    await oldTreasury
      .connect(user)
      .depositFunds(userAddress, DAI, depositAmount);

    const expectedTreasuryBalance = depositAmount.mul(2).sub(txFee);
    await execute("dai", txFee, expectedTreasuryBalance);
  });

  it("useFunds in DAI - funds in old treasury covers txFee", async () => {
    const depositAmount = ethers.utils.parseEther("1");
    const txFee = ethers.utils.parseEther("1");

    await depositDai(user, depositAmount);
    await depositDai(user2, depositAmount);
    await dai.connect(user).approve(oldTreasury.address, depositAmount);
    await oldTreasury
      .connect(user)
      .depositFunds(userAddress, DAI, depositAmount);

    const expectedTreasuryBalance = depositAmount.mul(2).sub(txFee);
    await execute("dai", txFee, expectedTreasuryBalance);
  });

  //---------------------------Helper functions-------------------------------
  const execute = async (
    token: "eth" | "dai",
    txFee: BigNumber,
    expectedTreasuryBalance: BigNumber
  ) => {
    const tokenAddress = token == "eth" ? ETH : DAI;

    await ops
      .connect(executor)
      .exec(
        txFee,
        tokenAddress,
        userAddress,
        true,
        true,
        resolverHash,
        execAddress,
        execData
      );

    const balanceAfter = await treasury.userTokenBalance(
      userAddress,
      tokenAddress
    );

    expect(balanceAfter).to.be.eql(expectedTreasuryBalance);
  };

  const depositEth = async (signer: Signer, depositAmount: BigNumber) => {
    const signerAddress = await signer.getAddress();
    const balanceBefore = await treasury.userTokenBalance(signerAddress, ETH);
    const value = depositAmount.div(2);

    await treasury.connect(signer).depositFunds(signerAddress, ETH, value, {
      value,
    });
    await signer.sendTransaction({
      to: treasury.address,
      value,
    });

    const balanceAfter = await treasury.userTokenBalance(signerAddress, ETH);

    expect(balanceAfter).to.be.eql(balanceBefore.add(depositAmount));
  };

  const depositDai = async (signer: Signer, depositAmount: BigNumber) => {
    const signerAddress = await signer.getAddress();
    const balanceBefore = await treasury.userTokenBalance(signerAddress, DAI);

    await dai.connect(signer).approve(treasury.address, depositAmount);
    await treasury
      .connect(signer)
      .depositFunds(signerAddress, DAI, depositAmount);

    const balanceAfter = await treasury.userTokenBalance(signerAddress, DAI);

    expect(balanceAfter).to.be.eql(balanceBefore.add(depositAmount));
  };

  const withdraw = async (
    signer: Signer,
    token: "eth" | "dai",
    withdrawAmount: BigNumber
  ) => {
    const signerAddress = await signer.getAddress();
    const tokenAddress = token == "eth" ? ETH : DAI;

    const treasuryBalanceBefore = await treasury.userTokenBalance(
      signerAddress,
      tokenAddress
    );
    const balanceBefore = await getBalance(deployerAddress, token);

    // withdraw to deployer to compare ETH balance change accurately, ignoring gas cost
    await treasury
      .connect(signer)
      .withdrawFunds(deployerAddress, tokenAddress, withdrawAmount);

    const treasuryBalanceAfter = await treasury.userTokenBalance(
      signerAddress,
      tokenAddress
    );
    const balanceAfter = await getBalance(deployerAddress, token);

    expect(treasuryBalanceAfter).to.be.eql(
      treasuryBalanceBefore.sub(withdrawAmount)
    );
    expect(balanceAfter).to.be.eql(balanceBefore.add(withdrawAmount));
  };

  const getBalance = async (
    address: string,
    token: "eth" | "dai"
  ): Promise<BigNumber> => {
    if (token == "eth") {
      return await ethers.provider.getBalance(address);
    } else {
      return await dai.balanceOf(address);
    }
  };
});
