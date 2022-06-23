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
  const execData2 = opsTest.interface.encodeFunctionData("increaseCount", [2]);
  const execDataNoPrepayment = opsTest.interface.encodeFunctionData(
    "increaseCountNoPrepayment",
    [1]
  );
  const execDataNoPrepayment2 = opsTest.interface.encodeFunctionData(
    "increaseCountNoPrepayment",
    [2]
  );

  const execSelector = opsTest.interface.getSighash("increaseCount");
  const execSelectorNoPrepayment = opsTest.interface.getSighash(
    "increaseCountNoPrepayment"
  );

  const forwarderResolverData = forwarder.interface.encodeFunctionData(
    "checker",
    [execData]
  );
  const forwarderResolverData2 = forwarder.interface.encodeFunctionData(
    "checker",
    [execData2]
  );
  const forwarderResolverDataNoPrepayment =
    forwarder.interface.encodeFunctionData("checker", [execDataNoPrepayment]);
  const forwarderResolverDataNoPrepayment2 =
    forwarder.interface.encodeFunctionData("checker", [execDataNoPrepayment2]);

  const resolverData = opsTest.interface.encodeFunctionData("checker", [1]);
  const resolverData2 = opsTest.interface.encodeFunctionData("checker", [2]);
  const resolverDataNoPrepayment = opsTest.interface.encodeFunctionData(
    "checkerNoPrepayment",
    [1]
  );
  const resolverDataNoPrepayment2 = opsTest.interface.encodeFunctionData(
    "checkerNoPrepayment",
    [2]
  );
  // ----------------------------------------------------------------------
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
      execSelectorNoPrepayment,
      forwarder.address,
      forwarderResolverDataNoPrepayment,
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
      execSelectorNoPrepayment,
      opsTest.address,
      resolverDataNoPrepayment,
      ETH
    )
  ).wait();
  console.log(`created: "resolver" "useTreasury: false"`);
  await sleep(5000);

  // ----------------------------------------------------------------------
  const startTime = 0;
  const interval = 5 * 60;
  (
    await ops.createTimedTask(
      startTime,
      interval,
      execAddress,
      execSelector,
      forwarder.address,
      forwarderResolverData2,
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
      execSelectorNoPrepayment,
      forwarder.address,
      forwarderResolverDataNoPrepayment2,
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
      resolverData2,
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
      execSelectorNoPrepayment,
      opsTest.address,
      resolverDataNoPrepayment2,
      ETH,
      false
    )
  ).wait();
  console.log(`created: "timed" "resolver" "useTreasury: false"`);
  await sleep(5000);
};

main();
