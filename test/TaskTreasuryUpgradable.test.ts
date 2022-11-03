import { expect } from "chai";
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumber } from "ethers";
import {
  encodeResolverArgs,
  getTokenFromFaucet,
  Module,
  ModuleData,
} from "./utils";
import {
  IERC20,
  CounterTest,
  Ops,
  TaskTreasuryL2,
  TaskTreasuryUpgradable,
  ResolverModule,
  ProxyModule,
} from "../typechain";

import hre = require("hardhat");
const { ethers, deployments } = hre;

const GELATO = "0x3CACa7b48D0573D793d3b0279b5F0029180E83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
const ZERO_ADD = ethers.constants.AddressZero;

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
  let oldTreasury: TaskTreasuryL2;
  let treasury: TaskTreasuryUpgradable;
  let counter: CounterTest;
  let resolverModule: ResolverModule;
  let proxyModule: ProxyModule;
  let dai: IERC20;
  let wbtc: IERC20;

  let execData: string;
  let execAddress: string;
  let moduleData: ModuleData;

  beforeEach(async function () {
    await deployments.fixture();
    [deployer, user, user2] = await ethers.getSigners();
    deployerAddress = await deployer.getAddress();
    userAddress = await user.getAddress();
    user2Address = await user2.getAddress();

    ops = await ethers.getContract("Ops");
    oldTreasury = await ethers.getContract("TaskTreasuryL2");
    treasury = await ethers.getContract("TaskTreasuryUpgradable");
    dai = await ethers.getContractAt("IERC20", DAI);
    wbtc = await ethers.getContractAt("IERC20", WBTC);
    resolverModule = await ethers.getContract("ResolverModule");
    proxyModule = await ethers.getContract("ProxyModule");

    const counterFactory = await ethers.getContractFactory("CounterTest");
    counter = <CounterTest>await counterFactory.deploy(ops.address);

    // get accounts
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [GELATO],
    });

    executor = await ethers.getSigner(GELATO);

    // account set-up
    const value = ethers.utils.parseEther("100");
    const wbtcValue = ethers.utils.parseUnits("0.5", "gwei"); // 2WBTC
    await getTokenFromFaucet(DAI, userAddress, value);
    await getTokenFromFaucet(DAI, user2Address, value);
    await getTokenFromFaucet(WBTC, userAddress, wbtcValue);
    await getTokenFromFaucet(WBTC, user2Address, wbtcValue);

    // module set-up
    await ops.setModule(
      [Module.RESOLVER, Module.PROXY],
      [resolverModule.address, proxyModule.address]
    );

    // whitelist
    oldTreasury.connect(deployer).addWhitelistedService(treasury.address);
    treasury.connect(deployer).updateWhitelistedService(ops.address, true);

    // create task
    const execSelector = counter.interface.getSighash("increaseCount");
    execAddress = counter.address;
    execData = counter.interface.encodeFunctionData("increaseCount", [1]);

    const resolverAddress = ethers.constants.AddressZero;
    const resolverData = ethers.constants.HashZero;
    const resolverArgs = encodeResolverArgs(resolverAddress, resolverData);
    moduleData = {
      modules: [Module.RESOLVER],
      args: [resolverArgs],
    };
    await ops
      .connect(user)
      .createTask(execAddress, execSelector, moduleData, ZERO_ADD);
  });

  it("ops proxy should have correct treasury address", async () => {
    expect(await ops.taskTreasury()).to.be.eql(treasury.address);
  });

  it("maxFee should be correct", async () => {
    expect(await treasury.maxFee()).to.be.eql(ethers.utils.parseEther("100"));
  });

  it("deposit ETH", async () => {
    const depositAmount = ethers.utils.parseEther("5");

    await depositEth(user, depositAmount);
  });

  it("deposit DAI", async () => {
    const depositAmount = ethers.utils.parseEther("5");

    await depositErc20(user, DAI, depositAmount);
  });

  it("deposit WBTC", async () => {
    const depositAmount = ethers.utils.parseUnits("0.1", "gwei");

    await depositErc20(user, WBTC, depositAmount);
  });

  it("first deposit less than MIN_SHARES_IN_TREASURY", async () => {
    const depositAmount = ethers.BigNumber.from("1");

    await expect(depositEth(user, depositAmount)).to.be.revertedWith(
      "TaskTreasury: Require MIN_SHARES_IN_TREASURY"
    );
    await expect(depositErc20(user, DAI, depositAmount)).to.be.revertedWith(
      "TaskTreasury: Require MIN_SHARES_IN_TREASURY"
    );
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

    await depositErc20(user, DAI, depositAmount1);
    await depositErc20(user2, DAI, depositAmount2);
  });

  it("multiple users deposit WBTC", async () => {
    const depositAmount1 = ethers.utils.parseUnits("0.2", "gwei");
    const depositAmount2 = ethers.utils.parseUnits("0.3", "gwei");

    await depositErc20(user, WBTC, depositAmount1);
    await depositErc20(user2, WBTC, depositAmount2);
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

    await depositErc20(user, DAI, depositAmount1);
    await depositErc20(user2, DAI, depositAmount2);

    const withdrawAmount = ethers.utils.parseEther("3");

    await withdraw(user, "dai", withdrawAmount);
    await withdraw(user2, "dai", withdrawAmount);
  });

  it("multiple users deposit then withdraw WBTC", async () => {
    const depositAmount1 = ethers.utils.parseUnits("0.02", "gwei");
    const depositAmount2 = ethers.utils.parseUnits("0.03", "gwei");

    await depositErc20(user, WBTC, depositAmount1);
    await depositErc20(user2, WBTC, depositAmount2);

    const withdrawAmount = ethers.utils.parseUnits("0.01", "gwei");

    await withdraw(user, "wbtc", withdrawAmount);
    await withdraw(user2, "wbtc", withdrawAmount);
  });

  it("withdraw below MIN_SHARES_IN_TREASURY", async () => {
    const depositAmount1 = ethers.utils.parseEther("10");
    const depositAmount2 = ethers.utils.parseUnits("0.2", "gwei");
    const withdrawAmount1 = depositAmount1.sub(10);
    const withdrawAmount2 = depositAmount2.sub(10);

    await depositEth(user, depositAmount1);
    await expect(withdraw(user, "eth", withdrawAmount1)).to.be.revertedWith(
      "TaskTreasury: Below MIN_SHARES_IN_TREASURY"
    );
    await depositErc20(user, WBTC, depositAmount2);
    await expect(withdraw(user, "wbtc", withdrawAmount2)).to.be.revertedWith(
      "TaskTreasury: Below MIN_SHARES_IN_TREASURY"
    );
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

    await depositErc20(user, DAI, depositAmount);
    await depositErc20(user2, DAI, depositAmount);

    const expectedTreasuryBalance = depositAmount.sub(txFee);
    await execute("dai", txFee, expectedTreasuryBalance);
  });

  it("useFunds in DAI - funds in old treasury partially covers txFee", async () => {
    const depositAmount = ethers.utils.parseEther("1");
    const txFee = ethers.utils.parseEther("1.5");

    await depositErc20(user, DAI, depositAmount);
    await depositErc20(user2, DAI, depositAmount);
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

    await depositErc20(user, DAI, depositAmount);
    await depositErc20(user2, DAI, depositAmount);
    await dai.connect(user).approve(oldTreasury.address, depositAmount);
    await oldTreasury
      .connect(user)
      .depositFunds(userAddress, DAI, depositAmount);

    const expectedTreasuryBalance = depositAmount.mul(2).sub(txFee);
    await execute("dai", txFee, expectedTreasuryBalance);
  });

  it("getCreditTokensByUser & totalUserTokenBalance", async () => {
    const depositAmount = ethers.utils.parseEther("1");
    const depositAmount2 = ethers.utils.parseUnits("0.2", "gwei");

    await oldTreasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });

    await dai.connect(user).approve(oldTreasury.address, depositAmount);
    await oldTreasury
      .connect(user)
      .depositFunds(userAddress, DAI, depositAmount);

    await depositEth(user, depositAmount);
    await depositErc20(user, DAI, depositAmount);
    await depositErc20(user, WBTC, depositAmount2);

    const tokens = await treasury.getTotalCreditTokensByUser(userAddress);
    expect(tokens.includes(ETH)).to.be.eql(true);
    expect(tokens.includes(DAI)).to.be.eql(true);
    expect(tokens.includes(WBTC)).to.be.eql(true);

    const daiTokenBalance = await treasury.totalUserTokenBalance(
      userAddress,
      DAI
    );
    const ethTokenBalance = await treasury.totalUserTokenBalance(
      userAddress,
      ETH
    );
    expect(daiTokenBalance).to.be.eql(depositAmount.mul(2));
    expect(ethTokenBalance).to.be.eql(depositAmount.mul(2));
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
        userAddress,
        execAddress,
        execData,
        moduleData,
        txFee,
        tokenAddress,
        true,
        true
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

  const depositErc20 = async (
    signer: Signer,
    tokenAddress: string,
    depositAmount: BigNumber
  ) => {
    const signerAddress = await signer.getAddress();
    const balanceBefore = await treasury.userTokenBalance(
      signerAddress,
      tokenAddress
    );

    const erc20 = await ethers.getContractAt("IERC20", tokenAddress);
    await erc20.connect(signer).approve(treasury.address, depositAmount);
    await treasury
      .connect(signer)
      .depositFunds(signerAddress, tokenAddress, depositAmount);

    const balanceAfter = await treasury.userTokenBalance(
      signerAddress,
      tokenAddress
    );

    expect(balanceAfter).to.be.eql(balanceBefore.add(depositAmount));
  };

  const withdraw = async (
    signer: Signer,
    token: "eth" | "dai" | "wbtc",
    withdrawAmount: BigNumber
  ) => {
    const signerAddress = await signer.getAddress();
    const tokenAddress = token == "eth" ? ETH : token == "dai" ? DAI : WBTC;

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
    token: "eth" | "dai" | "wbtc"
  ): Promise<BigNumber> => {
    if (token == "eth") {
      return await ethers.provider.getBalance(address);
    } else if (token == "dai") {
      return await dai.balanceOf(address);
    } else return await wbtc.balanceOf(address);
  };
});
