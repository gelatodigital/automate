import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { getTokenFromFaucet } from "./helpers";

const gelatoAddress = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

import {
  PokeMe,
  CounterWithoutTreasury,
  CounterResolverWithoutTreasury,
  TaskTreasury,
  IERC20,
} from "../typechain";

describe("PokeMeV3 Test", function () {
  let pokeMe: PokeMe;
  let counter: CounterWithoutTreasury;
  let counterResolver: CounterResolverWithoutTreasury;
  let taskTreasury: TaskTreasury;
  let dai: IERC20;

  let user: SignerWithAddress;
  let userAddress: string;

  let executor: any;
  let executorAddress: string;

  let resolverData: any;
  let taskHashETH: any;
  let taskHashDAI: any;
  let selector: any;
  let resolverHashETH: any;
  let resolverHashDAI: any;

  beforeEach(async function () {
    [user] = await ethers.getSigners();
    userAddress = await user.getAddress();

    const taskTreasuryFactory = await ethers.getContractFactory("TaskTreasury");
    const pokeMeFactory = await ethers.getContractFactory("PokeMe");
    const counterFactory = await ethers.getContractFactory(
      "CounterWithoutTreasury"
    );

    const counterResolverFactory = await ethers.getContractFactory(
      "CounterResolverWithoutTreasury"
    );

    dai = <IERC20>await ethers.getContractAt("IERC20", DAI);
    taskTreasury = <TaskTreasury>(
      await taskTreasuryFactory.deploy(gelatoAddress)
    );
    pokeMe = <PokeMe>(
      await pokeMeFactory.deploy(gelatoAddress, taskTreasury.address)
    );
    counter = <CounterWithoutTreasury>(
      await counterFactory.deploy(pokeMe.address)
    );
    counterResolver = <CounterResolverWithoutTreasury>(
      await counterResolverFactory.deploy(counter.address)
    );

    executorAddress = gelatoAddress;

    await taskTreasury.addWhitelistedService(pokeMe.address);

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [executorAddress],
    });

    executor = await ethers.provider.getSigner(executorAddress);

    resolverData = await counterResolver.interface.encodeFunctionData(
      "checker"
    );

    selector = await pokeMe.getSelector("increaseCount(uint256)");

    resolverHashETH = await pokeMe.getResolverHash(
      counterResolver.address,
      resolverData
    );

    resolverHashDAI = await pokeMe.getResolverHash(
      counterResolver.address,
      resolverData
    );

    taskHashETH = await pokeMe.getTaskId(
      userAddress,
      counter.address,
      selector,
      false,
      ETH,
      resolverHashETH
    );

    taskHashDAI = await pokeMe.getTaskId(
      userAddress,
      counter.address,
      selector,
      false,
      DAI,
      resolverHashDAI
    );

    await expect(
      pokeMe
        .connect(user)
        .createTaskNoPrepayment(
          counter.address,
          selector,
          counterResolver.address,
          resolverData,
          ETH
        )
    )
      .to.emit(pokeMe, "TaskCreated")
      .withArgs(
        userAddress,
        counter.address,
        selector,
        counterResolver.address,
        taskHashETH,
        resolverData,
        false,
        ETH,
        resolverHashETH
      );

    await expect(
      pokeMe
        .connect(user)
        .createTaskNoPrepayment(
          counter.address,
          selector,
          counterResolver.address,
          resolverData,
          DAI
        )
    )
      .to.emit(pokeMe, "TaskCreated")
      .withArgs(
        userAddress,
        counter.address,
        selector,
        counterResolver.address,
        taskHashDAI,
        resolverData,
        false,
        DAI,
        resolverHashDAI
      );
  });

  it("canExec should be true, counter does not have enough ETH", async () => {
    const THREE_MIN = 3 * 60;

    await network.provider.send("evm_increaseTime", [THREE_MIN]);
    await network.provider.send("evm_mine", []);

    const depositAmount = ethers.utils.parseEther("0.5");

    await user.sendTransaction({
      to: counter.address,
      value: depositAmount,
    });

    expect(await ethers.provider.getBalance(counter.address)).to.be.eq(
      depositAmount
    );

    const [canExec, execData] = await counterResolver.checker();
    expect(canExec).to.be.eq(true);

    await expect(
      pokeMe
        .connect(executor)
        .exec(
          ethers.utils.parseEther("1"),
          ETH,
          userAddress,
          false,
          resolverHashETH,
          counter.address,
          execData
        )
    ).to.be.reverted;
  });

  it("canExec should be true, counter does not have enough DAI", async () => {
    const THREE_MIN = 3 * 60;

    await network.provider.send("evm_increaseTime", [THREE_MIN]);
    await network.provider.send("evm_mine", []);

    const depositAmount = ethers.utils.parseEther("0.5");

    await getTokenFromFaucet(DAI, counter.address, depositAmount);

    expect(await dai.balanceOf(counter.address)).to.be.eq(depositAmount);

    const [canExec, execData] = await counterResolver.checker();
    expect(canExec).to.be.eq(true);

    await expect(
      pokeMe
        .connect(executor)
        .exec(
          ethers.utils.parseEther("1"),
          DAI,
          userAddress,
          false,
          resolverHashDAI,
          counter.address,
          execData
        )
    ).to.be.reverted;
  });

  it("canExec should be true, counter have enough ETH", async () => {
    const THREE_MIN = 3 * 60;

    await network.provider.send("evm_increaseTime", [THREE_MIN]);
    await network.provider.send("evm_mine", []);

    const depositAmount = ethers.utils.parseEther("5");

    await user.sendTransaction({
      to: counter.address,
      value: depositAmount,
    });

    expect(await ethers.provider.getBalance(counter.address)).to.be.eq(
      depositAmount
    );

    const gelatoBalanceBefore = await ethers.provider.getBalance(gelatoAddress);

    const [canExec, execData] = await counterResolver.checker();
    expect(canExec).to.be.eq(true);

    await pokeMe
      .connect(executor)
      .exec(
        ethers.utils.parseEther("1"),
        ETH,
        userAddress,
        false,
        resolverHashETH,
        counter.address,
        execData
      );

    const gelatoBalanceAfter = await ethers.provider.getBalance(gelatoAddress);
    expect(gelatoBalanceAfter).to.be.gt(gelatoBalanceBefore);
    expect(await counter.count()).to.be.eq(ethers.BigNumber.from("100"));
  });

  it("canExec should be true, counter does not have enough DAI", async () => {
    const THREE_MIN = 3 * 60;

    await network.provider.send("evm_increaseTime", [THREE_MIN]);
    await network.provider.send("evm_mine", []);

    const depositAmount = ethers.utils.parseEther("1");

    await getTokenFromFaucet(DAI, counter.address, depositAmount);

    expect(await dai.balanceOf(counter.address)).to.be.eq(depositAmount);

    const gelatoDaiBefore = await dai.balanceOf(gelatoAddress);

    const [canExec, execData] = await counterResolver.checker();
    expect(canExec).to.be.eq(true);

    await pokeMe
      .connect(executor)
      .exec(
        ethers.utils.parseEther("1"),
        DAI,
        userAddress,
        false,
        resolverHashDAI,
        counter.address,
        execData
      );

    const gelatoDaiAfter = await dai.balanceOf(gelatoAddress);

    expect(gelatoDaiAfter).to.be.gt(gelatoDaiBefore);
    expect(await counter.count()).to.be.eq(ethers.BigNumber.from("100"));
  });
});
