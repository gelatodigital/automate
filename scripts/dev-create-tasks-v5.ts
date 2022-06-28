import { ethers } from "hardhat";
import { sleep } from "../hardhat/utils";
import {
  encodeResolverArgs,
  encodeTimeArgs,
  Module,
  ModuleData,
} from "../test/utils";
import { Ops, OpsTest } from "../typechain";

const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ZERO = ethers.constants.AddressZero;

const main = async () => {
  const [owner] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();
  console.log("Owner: ", ownerAddress);

  const ops = <Ops>await ethers.getContract("Ops");
  const opsTest = <OpsTest>await ethers.getContract("OpsTest");

  const execAddress = opsTest.address;
  const execData = opsTest.interface.encodeFunctionData("increaseCount", [1]);
  const execDataNoPrepayment = opsTest.interface.encodeFunctionData(
    "increaseCountNoPrepayment",
    [1]
  );
  const execSelector = opsTest.interface.getSighash("increaseCount");
  const execSelectorNoPrepayment = opsTest.interface.getSighash(
    "increaseCountNoPrepayment"
  );

  const resolverAddress = opsTest.address;
  const resolverData = opsTest.interface.encodeFunctionData("checker", [1]);
  const resolverDataNoPrepayment = opsTest.interface.encodeFunctionData(
    "checkerNoPrepayment",
    [1]
  );
  let moduleData: ModuleData = { modules: [], args: [] };

  const timeModuleArgs = encodeTimeArgs(0, 3 * 60);

  const resolverModuleArgs = encodeResolverArgs(resolverAddress, resolverData);

  const resolverModuleArgsNoPrepayment = encodeResolverArgs(
    resolverAddress,
    resolverDataNoPrepayment
  );

  // Create tasks for each module type
  //----------------------------------------------------------------------
  // "whenever possible" "useTreasury"
  await (await ops.createTask(execAddress, execData, moduleData, ZERO)).wait();
  console.log(`created: "whenever possible" "useTreasury"`);
  await sleep(5000);

  // "whenever possible" "useTreasury: false"
  await (
    await ops.createTask(execAddress, execDataNoPrepayment, moduleData, ETH)
  ).wait();
  console.log(`created: "whenever possible" "useTreasury: false"`);
  await sleep(5000);

  //----------------------------------------------------------------------
  moduleData = { modules: [Module.TIME], args: [timeModuleArgs] };

  //  "time" "predefined inputs" "useTreasury"
  await (await ops.createTask(execAddress, execData, moduleData, ZERO)).wait();
  console.log(`created: "time" "predefined inputs" "useTreasury"`);
  await sleep(5000);

  //  "time" "predefined inputs" "useTreasury: false"
  await (
    await ops.createTask(execAddress, execDataNoPrepayment, moduleData, ETH)
  ).wait();
  console.log(`created: "time" "predefined inputs" "useTreasury: false"`);
  await sleep(5000);

  //----------------------------------------------------------------------
  moduleData = { modules: [Module.RESOLVER], args: [resolverModuleArgs] };

  // "resolver" "useTreasury"
  await (
    await ops.createTask(execAddress, execSelector, moduleData, ZERO)
  ).wait();
  console.log(`created: "resolver" "useTreasury"`);
  await sleep(5000);

  moduleData = {
    modules: [Module.RESOLVER],
    args: [resolverModuleArgsNoPrepayment],
  };
  // "resolver" "useTreasury: false"
  await (
    await ops.createTask(execAddress, execSelectorNoPrepayment, moduleData, ETH)
  ).wait();
  console.log(`created: "resolver" "useTreasury: false"`);
  await sleep(5000);

  //----------------------------------------------------------------------
  moduleData = { modules: [Module.PROXY], args: ["0x"] };

  // "proxy" "predefined inputs" "useTreasury"
  await (await ops.createTask(execAddress, execData, moduleData, ZERO)).wait();
  console.log(`created: "proxy" "predefined inputs" "useTreasury"`);
  await sleep(5000);

  // "proxy" "predefined inputs" "useTreasury: false"
  await (
    await ops.createTask(execAddress, execDataNoPrepayment, moduleData, ETH)
  ).wait();
  console.log(`created: "proxy" "predefined inputs" "useTreasury: false"`);
  await sleep(5000);

  //----------------------------------------------------------------------
  moduleData = { modules: [Module.SINGLE_EXEC], args: ["0x"] };

  // "singleExec" "predefined inputs" "useTreasury"
  await (await ops.createTask(execAddress, execData, moduleData, ZERO)).wait();
  console.log(`created: "singleExec" "predefined inputs" "useTreasury"`);
  await sleep(5000);

  // "singleExec" "predefined inputs" "useTreasury: false"
  await (
    await ops.createTask(execAddress, execDataNoPrepayment, moduleData, ETH)
  ).wait();
  console.log(`created: "singleExec" "predefined inputs" "useTreasury: false"`);
  await sleep(5000);

  // Create tasks for commonly matched module type
  //----------------------------------------------------------------------
  moduleData = {
    modules: [Module.RESOLVER, Module.PROXY],
    args: [resolverModuleArgs, "0x"],
  };

  // "resolver" "proxy" "useTreasury"
  await (
    await ops.createTask(execAddress, execSelector, moduleData, ZERO)
  ).wait();
  console.log(`created: "resolver" "proxy" "useTreasury"`);
  await sleep(5000);

  moduleData = {
    modules: [Module.RESOLVER, Module.PROXY],
    args: [resolverModuleArgsNoPrepayment, "0x"],
  };
  // "resolver" "proxy" "useTreasury: false"
  await (
    await ops.createTask(execAddress, execSelectorNoPrepayment, moduleData, ETH)
  ).wait();
  console.log(`created: "resolver" "proxy" "useTreasury: false"`);
  await sleep(5000);

  //----------------------------------------------------------------------
  moduleData = {
    modules: [Module.RESOLVER, Module.TIME, Module.PROXY],
    args: [resolverModuleArgs, timeModuleArgs, "0x"],
  };

  // "resolver" "time" "proxy" "useTreasury"
  await (
    await ops.createTask(execAddress, execSelector, moduleData, ZERO)
  ).wait();
  console.log(`created: "resolver" "time" "proxy" "useTreasury"`);
  await sleep(5000);

  moduleData = {
    modules: [Module.RESOLVER, Module.TIME, Module.PROXY],
    args: [resolverModuleArgsNoPrepayment, timeModuleArgs, "0x"],
  };
  // "resolver" "time" "proxy" "useTreasury: false"
  await (
    await ops.createTask(execAddress, execSelectorNoPrepayment, moduleData, ETH)
  ).wait();
  console.log(`created: "resolver" "time" "proxy" "useTreasury: false"`);
  await sleep(5000);

  //----------------------------------------------------------------------
};

main();
