import { ethers } from "hardhat";
import { sleep } from "../hardhat/utils";
import { OpsTest, IForwarder, ILegacyOps } from "../typechain";

const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ZERO = ethers.constants.AddressZero;

const main = async () => {
  const [owner] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();
  console.log("Owner: ", ownerAddress);

  const ops = <ILegacyOps>await ethers.getContract("Ops");
  const opsTest = <OpsTest>await ethers.getContract("OpsTest");
  const forwarder = <IForwarder>await ethers.getContract("Forwarder");

  const execAddress = opsTest.address;
  const execData = opsTest.interface.encodeFunctionData("increaseCount", [1]);
  const execSelector = opsTest.interface.getSighash("increaseCount");

  const forwarderResolverData = forwarder.interface.encodeFunctionData(
    "checker",
    [execData]
  );
  const resolverData = opsTest.interface.encodeFunctionData("checker", [1]);

  //----------------------------------------------------------------------
  (
    await ops.createTask(
      execAddress,
      execSelector,
      forwarder.address,
      forwarderResolverData
    )
  ).wait();
  console.log(`created: "whenever possible" "useTreasury"`);
  await sleep(5000);

  (
    await ops.createTaskNoPrepayment(
      execAddress,
      execSelector,
      forwarder.address,
      forwarderResolverData,
      ETH
    )
  ).wait();
  console.log(`created: "whenever possible" "useTreasury: false"`);
  await sleep(5000);

  //----------------------------------------------------------------------
  (
    await ops.createTask(
      execAddress,
      execSelector,
      opsTest.address,
      resolverData
    )
  ).wait();
  console.log(`created: "resolver" "useTreasury"`);
  await sleep(5000);

  (
    await ops.createTaskNoPrepayment(
      execAddress,
      execSelector,
      opsTest.address,
      resolverData,
      ETH
    )
  ).wait();
  console.log(`created: "resolver" "useTreasury: false"`);
  await sleep(5000);

  //----------------------------------------------------------------------
  const startTime = 0;
  const interval = 5 * 60;
  (
    await ops.createTimedTask(
      startTime,
      interval,
      execAddress,
      execSelector,
      forwarder.address,
      forwarderResolverData,
      ZERO,
      true
    )
  ).wait();
  console.log(`created: "timed" "useTreasury"`);
  await sleep(5000);

  (
    await ops.createTimedTask(
      startTime,
      interval,
      execAddress,
      execSelector,
      forwarder.address,
      forwarderResolverData,
      ETH,
      false
    )
  ).wait();
  console.log(`created: "timed" "useTreasury: false"`);
  await sleep(5000);

  (
    await ops.createTimedTask(
      startTime,
      interval,
      execAddress,
      execSelector,
      opsTest.address,
      resolverData,
      ZERO,
      true
    )
  ).wait();
  console.log(`created: "timed" "resolver" "useTreasury"`);
  await sleep(5000);

  (
    await ops.createTimedTask(
      startTime,
      interval,
      execAddress,
      execSelector,
      opsTest.address,
      resolverData,
      ETH,
      false
    )
  ).wait();
  console.log(`created: "timed" "resolver" "useTreasury: false"`);
  await sleep(5000);
};

main();
