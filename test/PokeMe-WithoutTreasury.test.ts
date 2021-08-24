import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { getTokenFromFaucet } from "./helpers";

const gelatoAddress = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";

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

  let resolverDataETH: any;
  let resolverDataDAI: any;
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
      await counterFactory.deploy(pokeMe.address, gelatoAddress)
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

    resolverDataETH = await counterResolver.interface.encodeFunctionData(
      "checker",
      [ETH]
    );
    resolverDataDAI = await counterResolver.interface.encodeFunctionData(
      "checker",
      [DAI]
    );

    selector = await pokeMe.getSelector("increaseCount(uint256)");

    resolverHashETH = await pokeMe.getResolverHash(
      counterResolver.address,
      resolverDataETH
    );

    resolverHashDAI = await pokeMe.getResolverHash(
      counterResolver.address,
      resolverDataDAI
    );

    taskHashETH = await pokeMe.getTaskId(
      userAddress,
      counter.address,
      selector,
      false,
      resolverHashETH
    );

    taskHashDAI = await pokeMe.getTaskId(
      userAddress,
      counter.address,
      selector,
      false,
      resolverHashDAI
    );

    await expect(
      pokeMe
        .connect(user)
        .createTask(
          counter.address,
          selector,
          counterResolver.address,
          resolverDataETH,
          false
        )
    )
      .to.emit(pokeMe, "TaskCreated")
      .withArgs(
        userAddress,
        counter.address,
        selector,
        counterResolver.address,
        taskHashETH,
        resolverDataETH,
        false,
        resolverHashETH
      );

    await expect(
      pokeMe
        .connect(user)
        .createTask(
          counter.address,
          selector,
          counterResolver.address,
          resolverDataDAI,
          false
        )
    )
      .to.emit(pokeMe, "TaskCreated")
      .withArgs(
        userAddress,
        counter.address,
        selector,
        counterResolver.address,
        taskHashDAI,
        resolverDataDAI,
        false,
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

    const [canExec, execData, feeToken] = await counterResolver.checker(ETH);
    expect(canExec).to.be.eq(true);

    await expect(
      pokeMe
        .connect(executor)
        .exec(
          ethers.utils.parseEther("1"),
          feeToken,
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

    const [canExec, execData, feeToken] = await counterResolver.checker(DAI);
    expect(canExec).to.be.eq(true);

    await expect(
      pokeMe
        .connect(executor)
        .exec(
          ethers.utils.parseEther("1"),
          feeToken,
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

    const [canExec, execData, feeToken] = await counterResolver.checker(ETH);
    expect(canExec).to.be.eq(true);

    await pokeMe
      .connect(executor)
      .exec(
        ethers.utils.parseEther("1"),
        feeToken,
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

    const [canExec, execData, feeToken] = await counterResolver.checker(DAI);
    expect(canExec).to.be.eq(true);

    await pokeMe
      .connect(executor)
      .exec(
        ethers.utils.parseEther("1"),
        feeToken,
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

  //   it("canExec should be true, caller does not have enough DAI", async () => {
  //     const THREE_MIN = 3 * 60;

  //     await network.provider.send("evm_increaseTime", [THREE_MIN]);
  //     await network.provider.send("evm_mine", []);

  //     const [canExec, execData] = await counterResolver.checker();
  //     expect(canExec).to.be.eq(true);

  //     const depositAmount = ethers.utils.parseEther("0.5");
  //     await getTokenFromFaucet(DAI, userAddress, depositAmount);

  //     await dai.connect(user).approve(taskTreasury.address, depositAmount);
  //     await taskTreasury
  //       .connect(user)
  //       .depositFunds(userAddress, DAI, depositAmount);

  //     await expect(
  //       pokeMe
  //         .connect(executor)
  //         .exec(
  //           ethers.utils.parseEther("1"),
  //           DAI,
  //           userAddress,
  //           true,
  //           resolverHash,
  //           counter.address,
  //           execData
  //         )
  //     ).to.be.revertedWith(
  //       "reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)"
  //     );

  //     expect(await taskTreasury.userTokenBalance(userAddress, DAI)).to.be.eql(
  //       depositAmount
  //     );
  //   });

  //   it("should exec and pay with ETH", async () => {
  //     const [canExec, execData] = await counterResolver.checker();
  //     expect(canExec).to.be.eq(true);

  //     const THREE_MIN = 3 * 60;

  //     await network.provider.send("evm_increaseTime", [THREE_MIN]);
  //     await network.provider.send("evm_mine", []);

  //     expect(await counter.count()).to.be.eq(ethers.BigNumber.from("0"));

  //     const depositAmount = ethers.utils.parseEther("1");
  //     await taskTreasury
  //       .connect(user)
  //       .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });

  //     expect(
  //       await taskTreasury.connect(user).userTokenBalance(userAddress, ETH)
  //     ).to.be.eq(ethers.utils.parseEther("1"));

  //     await pokeMe
  //       .connect(executor)
  //       .exec(
  //         ethers.utils.parseEther("1"),
  //         ETH,
  //         userAddress,
  //         true,
  //         resolverHash,
  //         counter.address,
  //         execData
  //       );

  //     expect(await counter.count()).to.be.eq(ethers.BigNumber.from("100"));
  //     expect(
  //       await taskTreasury.connect(user).userTokenBalance(userAddress, ETH)
  //     ).to.be.eq(ethers.BigNumber.from("0"));

  //     // time not elapsed
  //     await expect(
  //       pokeMe
  //         .connect(executor)
  //         .exec(
  //           ethers.utils.parseEther("1"),
  //           ETH,
  //           userAddress,
  //           true,
  //           resolverHash,
  //           counter.address,
  //           execData
  //         )
  //     ).to.be.revertedWith("PokeMe: exec: Execution failed");
  //   });

  //   it("should exec and pay with DAI", async () => {
  //     const [canExec, execData] = await counterResolver.checker();
  //     expect(canExec).to.be.eq(true);

  //     const THREE_MIN = 3 * 60;

  //     await network.provider.send("evm_increaseTime", [THREE_MIN]);
  //     await network.provider.send("evm_mine", []);

  //     const depositAmount = ethers.utils.parseEther("2");
  //     await getTokenFromFaucet(DAI, userAddress, depositAmount);

  //     await dai.connect(user).approve(taskTreasury.address, depositAmount);
  //     await taskTreasury
  //       .connect(user)
  //       .depositFunds(userAddress, DAI, depositAmount);

  //     expect(
  //       await taskTreasury.connect(user).userTokenBalance(userAddress, DAI)
  //     ).to.be.eq(ethers.utils.parseEther("2"));

  //     await pokeMe
  //       .connect(executor)
  //       .exec(
  //         ethers.utils.parseEther("1"),
  //         DAI,
  //         userAddress,
  //         true,
  //         resolverHash,
  //         counter.address,
  //         execData
  //       );

  //     expect(await counter.count()).to.be.eq(ethers.BigNumber.from("100"));

  //     // time not elapsed
  //     await expect(
  //       pokeMe
  //         .connect(executor)
  //         .exec(
  //           ethers.utils.parseEther("1"),
  //           DAI,
  //           userAddress,
  //           true,
  //           resolverHash,
  //           counter.address,
  //           execData
  //         )
  //     ).to.be.revertedWith("PokeMe: exec: Execution failed");
  //   });
});
