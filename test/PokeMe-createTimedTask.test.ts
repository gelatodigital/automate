/* eslint-disable @typescript-eslint/no-explicit-any */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import MegaPokerAbi from "./abis/MegaPoker.json";
import { PokeMe, TaskTreasury, Forwarder } from "../typechain";

const gelatoAddress = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const MEGAPOKER = "0x18Bd1a35Caf9F192234C7ABd995FBDbA5bBa81ca";
const THREE_MINUTES = 3 * 60;
const FEETOKEN = ethers.constants.AddressZero;

describe("PokeMe createTimedTask test", function () {
  this.timeout(0);

  let pokeMe: PokeMe;

  let taskTreasury: TaskTreasury;
  let megaPoker: any;
  let forwarder: Forwarder;

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

    megaPoker = await ethers.getContractAt(MegaPokerAbi, MEGAPOKER);
    taskTreasury = <TaskTreasury>(
      await taskTreasuryFactory.deploy(gelatoAddress)
    );
    pokeMe = <PokeMe>(
      await pokeMeFactory.deploy(gelatoAddress, taskTreasury.address)
    );
    forwarder = <Forwarder>await forwarderFactory.deploy();

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

    execData = await megaPoker.interface.encodeFunctionData("poke");
    interval = THREE_MINUTES;
    execAddress = MEGAPOKER;
    execSelector = await pokeMe.getSelector("poke()");
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

    await expect(
      pokeMe
        .connect(user)
        .createTimedTask(
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

  it("get time", async () => {
    const blocknumber = await ethers.provider.getBlockNumber();
    const timestamp = (await ethers.provider.getBlock(blocknumber)).timestamp;
    const time = await pokeMe.timedTask(taskId);
    console.log(Number(time.nextExec));
    console.log(Number(timestamp));

    if (Number(time.nextExec) >= Number(timestamp)) {
      console.log("Not time to exec");
    } else {
      console.log("TIme to exec");
    }
  });

  it("Forwarder should return true, exec should fail", async () => {
    const [canExec, payload] = await forwarder.checker(execData);

    expect(payload).to.be.eql(execData);
    expect(canExec).to.be.eql(true);

    await expect(
      pokeMe
        .connect(executor)
        .exec(
          ethers.utils.parseEther("1"),
          ETH,
          userAddress,
          true,
          resolverHash,
          execAddress,
          execData
        )
    ).to.be.revertedWith("PokeMe: exec: Too early");
  });

  it("Forwarder should return true, exec should succeed", async () => {
    await network.provider.send("evm_increaseTime", [THREE_MINUTES]);
    await network.provider.send("evm_mine", []);

    await expect(
      pokeMe
        .connect(executor)
        .exec(
          ethers.utils.parseEther("1"),
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
        ethers.utils.parseEther("1"),
        ETH,
        execAddress,
        execData,
        taskId
      );
  });
});
