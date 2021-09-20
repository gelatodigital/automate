/* eslint-disable @typescript-eslint/no-explicit-any */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import {
  PokeMe,
  TaskTreasury,
  Forwarder,
  CounterTimedTask,
} from "../typechain";

const gelatoAddress = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const THREE_MINUTES = 3 * 60;
const FEETOKEN = ethers.constants.AddressZero;

describe("PokeMe createTimedTask test", function () {
  this.timeout(0);

  let pokeMe: PokeMe;

  let taskTreasury: TaskTreasury;
  let forwarder: Forwarder;
  let counter: CounterTimedTask;

  let user: SignerWithAddress;
  let userAddress: string;

  let executor: any;
  let executorAddress: string;

  let interval: number;
  let execAddress: string;
  let execSelector: string;
  let execData: string;
  let resolverAddress: string;
  let resolverData: string;
  let taskId: string;
  let resolverHash: string;

  before(async function () {
    [user] = await ethers.getSigners();
    userAddress = await user.getAddress();

    const taskTreasuryFactory = await ethers.getContractFactory("TaskTreasury");
    const pokeMeFactory = await ethers.getContractFactory("PokeMe");
    const forwarderFactory = await ethers.getContractFactory("Forwarder");
    const counterFactory = await ethers.getContractFactory("CounterTimedTask");

    taskTreasury = <TaskTreasury>(
      await taskTreasuryFactory.deploy(gelatoAddress)
    );
    pokeMe = <PokeMe>(
      await pokeMeFactory.deploy(gelatoAddress, taskTreasury.address)
    );
    forwarder = <Forwarder>await forwarderFactory.deploy();
    counter = <CounterTimedTask>await counterFactory.deploy(pokeMe.address);

    executorAddress = gelatoAddress;

    await taskTreasury.addWhitelistedService(pokeMe.address);

    const depositAmount = ethers.utils.parseEther("1");
    await taskTreasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [executorAddress],
    });

    executor = await ethers.provider.getSigner(executorAddress);

    execData = await counter.interface.encodeFunctionData("increaseCount", [
      100,
    ]);
    interval = THREE_MINUTES;
    execAddress = counter.address;
    execSelector = await pokeMe.getSelector("increaseCount(uint256)");
    resolverAddress = forwarder.address;
    resolverData = await forwarder.interface.encodeFunctionData("checker", [
      execData,
    ]);

    resolverHash = ethers.utils.keccak256(
      new ethers.utils.AbiCoder().encode(
        ["address", "bytes"],
        [resolverAddress, resolverData]
      )
    );

    taskId = await pokeMe.getTaskId(
      userAddress,
      execAddress,
      execSelector,
      true,
      FEETOKEN,
      resolverHash
    );

    const currentTimestamp = (await user.provider?.getBlock("latest"))
      ?.timestamp as number;

    await expect(
      pokeMe
        .connect(user)
        .createTimedTask(
          currentTimestamp + interval,
          interval,
          execAddress,
          execSelector,
          resolverAddress,
          resolverData,
          FEETOKEN,
          true
        )
    )
      .to.emit(pokeMe, "TaskCreated")
      .withArgs(
        userAddress,
        execAddress,
        execSelector,
        resolverAddress,
        taskId,
        resolverData,
        true,
        FEETOKEN,
        resolverHash
      );
  });

  it("Exec should fail when time not elapsed", async () => {
    const [canExec, payload] = await forwarder.checker(execData);

    expect(payload).to.be.eql(execData);
    expect(canExec).to.be.eql(true);

    await expect(
      pokeMe
        .connect(executor)
        .exec(
          ethers.utils.parseEther("0.1"),
          ETH,
          userAddress,
          true,
          resolverHash,
          execAddress,
          execData
        )
    ).to.be.revertedWith("PokeMe: exec: Too early");
  });

  it("Exec should succeed when time elapse", async () => {
    await network.provider.send("evm_increaseTime", [THREE_MINUTES]);
    await network.provider.send("evm_mine", []);

    const nextExecBefore = (await pokeMe.timedTask(taskId)).nextExec;

    await counter.setExecutable(true);

    await expect(
      pokeMe
        .connect(executor)
        .exec(
          ethers.utils.parseEther("0.1"),
          ETH,
          userAddress,
          true,
          resolverHash,
          execAddress,
          execData
        )
    )
      .to.emit(pokeMe, "ExecSuccess")
      .withArgs(
        ethers.utils.parseEther("0.1"),
        ETH,
        execAddress,
        execData,
        taskId
      );

    const nextExecAfter = (await pokeMe.timedTask(taskId)).nextExec;

    expect(await taskTreasury.userTokenBalance(userAddress, ETH)).to.be.eql(
      ethers.utils.parseEther("0.9")
    );

    expect(Number(await counter.count())).to.be.eql(100);
    expect(nextExecAfter).to.be.gt(nextExecBefore);
  });

  it("Exec should succeed even if txn fails", async () => {
    await network.provider.send("evm_increaseTime", [THREE_MINUTES]);
    await network.provider.send("evm_mine", []);

    const nextExecBefore = (await pokeMe.timedTask(taskId)).nextExec;

    await counter.setExecutable(false);

    await expect(
      pokeMe
        .connect(executor)
        .exec(
          ethers.utils.parseEther("0.1"),
          ETH,
          userAddress,
          true,
          resolverHash,
          execAddress,
          execData
        )
    )
      .to.emit(pokeMe, "ExecSuccess")
      .withArgs(
        ethers.utils.parseEther("0.1"),
        ETH,
        execAddress,
        execData,
        taskId
      );

    const nextExecAfter = (await pokeMe.timedTask(taskId)).nextExec;

    expect(Number(await counter.count())).to.be.eql(100);
    expect(await taskTreasury.userTokenBalance(userAddress, ETH)).to.be.eql(
      ethers.utils.parseEther("0.8")
    );
    expect(nextExecAfter).to.be.gt(nextExecBefore);
  });

  it("should skip one interval", async () => {
    await network.provider.send("evm_increaseTime", [2 * THREE_MINUTES]);
    await network.provider.send("evm_mine", []);

    const nextExecBefore = (await pokeMe.timedTask(taskId)).nextExec;

    await counter.setExecutable(true);

    await expect(
      pokeMe
        .connect(executor)
        .exec(
          ethers.utils.parseEther("0.1"),
          ETH,
          userAddress,
          true,
          resolverHash,
          execAddress,
          execData
        )
    )
      .to.emit(pokeMe, "ExecSuccess")
      .withArgs(
        ethers.utils.parseEther("0.1"),
        ETH,
        execAddress,
        execData,
        taskId
      );

    const nextExecAfter = (await pokeMe.timedTask(taskId)).nextExec;

    expect(Number(await counter.count())).to.be.eql(200);
    expect(await taskTreasury.userTokenBalance(userAddress, ETH)).to.be.eql(
      ethers.utils.parseEther("0.7")
    );
    expect(Number(nextExecAfter.sub(nextExecBefore))).to.be.eql(
      2 * THREE_MINUTES
    );
  });

  it("Should account for drift", async () => {
    await network.provider.send("evm_increaseTime", [50 * THREE_MINUTES]);
    await network.provider.send("evm_mine", []);

    await pokeMe
      .connect(executor)
      .exec(
        ethers.utils.parseEther("0.1"),
        ETH,
        userAddress,
        true,
        resolverHash,
        execAddress,
        execData
      );

    await expect(
      pokeMe
        .connect(executor)
        .exec(
          ethers.utils.parseEther("0.1"),
          ETH,
          userAddress,
          true,
          resolverHash,
          execAddress,
          execData
        )
    ).to.be.revertedWith("PokeMe: exec: Too early");

    expect(Number(await counter.count())).to.be.eql(300);
    expect(await taskTreasury.userTokenBalance(userAddress, ETH)).to.be.eql(
      ethers.utils.parseEther("0.6")
    );
  });
});
