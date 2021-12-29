import { expect } from "chai";
import { Signer } from "@ethersproject/abstract-signer";
import {
  Counter,
  CounterResolver,
  TaskTreasuryAccounting,
  IOracleAggregator,
  IERC20,
  PokeMe,
} from "../typechain";
import { getTokenFromFaucet } from "./helpers";

import hre = require("hardhat");
const { ethers, deployments } = hre;
import * as dotenv from "dotenv";
const config = dotenv.config();

const ALCHEMY_ID = config?.parsed?.ALCHEMY_ID;
const GELATO = "0x3CACa7b48D0573D793d3b0279b5F0029180E83b6";
const ORACLE_AGGREGATOR = "0x64f31D46C52bBDe223D863B11dAb9327aB1414E9";
const OLD_TASK_TREASURY = "0x66e2F69df68C8F56837142bE2E8C290EfE76DA9f";
const USER = "0xAabB54394E8dd61Dd70897E9c80be8de7C64A895";
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const ETH = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

describe("TaskTreasuryAccounting test", function () {
  this.timeout(0);

  let owner: Signer;
  let user: Signer;
  let executor: Signer;
  let userAddress: string;
  let ownerAddress: string;

  let pokeMe: PokeMe;
  let treasury: TaskTreasuryAccounting;
  let counter: Counter;
  let counterResolver: CounterResolver;
  let oracle: IOracleAggregator;
  let dai: IERC20;

  let resolverHash: string;
  let execData: string;
  let taskId: string;

  before(async function () {
    forkMakerDepositDaiBlock();

    await deployments.fixture();

    [owner] = await hre.ethers.getSigners();
    ownerAddress = await owner.getAddress();

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [USER],
    });
    user = ethers.provider.getSigner(USER);
    userAddress = USER;

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [GELATO],
    });
    executor = await ethers.provider.getSigner(GELATO);

    const pokeMeFactory = await ethers.getContractFactory("PokeMe");
    const counterFactory = await ethers.getContractFactory("Counter");
    const counterResolverFactory = await ethers.getContractFactory(
      "CounterResolver"
    );

    treasury = <TaskTreasuryAccounting>(
      await ethers.getContract("TaskTreasuryAccounting")
    );
    pokeMe = <PokeMe>await pokeMeFactory.deploy(GELATO, treasury.address);
    counter = <Counter>await counterFactory.deploy(pokeMe.address);
    counterResolver = <CounterResolver>(
      await counterResolverFactory.deploy(counter.address)
    );

    oracle = <IOracleAggregator>(
      await ethers.getContractAt("IOracleAggregator", ORACLE_AGGREGATOR)
    );
    dai = <IERC20>await ethers.getContractAt("IERC20", DAI);

    await treasury.addWhitelistedService(pokeMe.address);
  });

  it("DAI from old treasury should be top credit token", async () => {
    const [topCreditInNativeToken, topCreditToken, treasuryAddress] =
      await treasury.getTopCreditToken(USER);

    const { returnAmount: daiInNativeToken } =
      await oracle.getExpectedReturnAmount(
        ethers.utils.parseEther("1000"),
        DAI,
        ETH
      );

    expect(daiInNativeToken).to.be.eq(topCreditInNativeToken);
    expect(topCreditToken).to.be.eq(DAI);
    expect(treasuryAddress).to.be.eq(OLD_TASK_TREASURY);
  });

  it("DAI balance should increase", async () => {
    const depositAmount = ethers.utils.parseEther("2000");
    await getTokenFromFaucet(DAI, userAddress, depositAmount);

    const daiBefore = await dai.balanceOf(userAddress);

    await dai.connect(user).approve(treasury.address, depositAmount);

    await treasury.connect(user).depositFunds(userAddress, DAI, depositAmount);

    const daiAfter = await dai.balanceOf(userAddress);

    expect(await treasury.userTokenBalance(userAddress, DAI)).to.be.eql(
      depositAmount
    );
    expect(daiBefore.sub(daiAfter)).to.be.eql(depositAmount);
  });

  it("DAI from new treasury should be top credit token", async () => {
    const [topCreditInNativeToken, topCreditToken, treasuryAddress] =
      await treasury.getTopCreditToken(USER);

    const { returnAmount: daiInNativeToken } =
      await oracle.getExpectedReturnAmount(
        ethers.utils.parseEther("2000"),
        DAI,
        ETH
      );

    expect(topCreditToken).to.be.eql(DAI);
    expect(treasuryAddress).to.be.eql(treasury.address);
    expect(daiInNativeToken).to.be.eql(topCreditInNativeToken);
  });

  it("DAI balance should decrease from successful execution", async () => {
    const selector = await pokeMe.getSelector("increaseCount(uint256)");
    const resolverData =
      counterResolver.interface.encodeFunctionData("checker");
    resolverHash = await pokeMe.getResolverHash(
      counterResolver.address,
      resolverData
    );
    taskId = await pokeMe.getTaskId(
      userAddress,
      counter.address,
      selector,
      true,
      ethers.constants.AddressZero,
      resolverHash
    );

    await pokeMe
      .connect(user)
      .createTask(
        counter.address,
        selector,
        counterResolver.address,
        resolverData
      );

    [, execData] = await counterResolver.checker();
    const userDaiBefore = await treasury.userTokenBalance(userAddress, DAI);
    const ownerDaiBefore = await treasury.userTokenBalance(ownerAddress, DAI);
    const fee = ethers.utils.parseEther("300");

    await expect(
      pokeMe
        .connect(executor)
        .exec(
          fee,
          DAI,
          userAddress,
          treasury.address,
          resolverHash,
          counter.address,
          execData
        )
    )
      .to.emit(pokeMe, "CallSuccess")
      .withArgs(taskId, true);

    const userDaiAfter = await treasury.userTokenBalance(userAddress, DAI);
    const ownerDaiAfter = await treasury.userTokenBalance(ownerAddress, DAI);
    expect(userDaiBefore.sub(userDaiAfter)).to.be.eql(fee);
    expect(ownerDaiAfter.sub(ownerDaiBefore)).to.be.eql(fee);
  });

  it("DAI balance should decrease from reverting execution", async () => {
    const userDaiBefore = await treasury.userTokenBalance(userAddress, DAI);
    const ownerDaiBefore = await treasury.userTokenBalance(ownerAddress, DAI);
    const fee = ethers.utils.parseEther("300");

    await expect(
      pokeMe
        .connect(executor)
        .exec(
          fee,
          DAI,
          userAddress,
          treasury.address,
          resolverHash,
          counter.address,
          execData
        )
    )
      .to.emit(pokeMe, "CallSuccess")
      .withArgs(taskId, false);

    const userDaiAfter = await treasury.userTokenBalance(userAddress, DAI);
    const ownerDaiAfter = await treasury.userTokenBalance(ownerAddress, DAI);
    expect(userDaiBefore.sub(userDaiAfter)).to.be.eql(fee);
    expect(ownerDaiAfter.sub(ownerDaiBefore)).to.be.eql(fee);
  });

  it("Owner should be able to withdraw DAI", async () => {
    const ownerDaiBefore = await dai.balanceOf(ownerAddress);

    const daiBalance = await treasury.userTokenBalance(ownerAddress, DAI);
    await treasury.connect(owner).withdrawFunds(ownerAddress, DAI, daiBalance);

    const ownerDaiAfter = await dai.balanceOf(ownerAddress);

    expect(ownerDaiAfter).to.be.eql(ownerDaiBefore.add(daiBalance));
  });
});

const forkMakerDepositDaiBlock = async () => {
  await hre.network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
          blockNumber: 13716692,
        },
      },
    ],
  });
};
