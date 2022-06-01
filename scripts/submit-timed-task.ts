import { ethers } from "hardhat";
import {
  encodeTimeArgs,
  getTimeStampNow,
  Module,
  ModuleData,
} from "../test/utils";
import { Counter, Ops } from "../typechain";

async function main() {
  const [user] = await ethers.getSigners();
  const userAddress = await user.getAddress();
  console.log("User Address: ", userAddress);

  const ops = <Ops>await ethers.getContract("Ops");
  const counter = <Counter>await ethers.getContract("Counter");

  console.log("Submitting Task");

  console.log("Counter address: ", counter.address);

  const execData = counter.interface.encodeFunctionData("increaseCount", [100]);
  const interval = 5 * 60;
  const startTime = await getTimeStampNow();
  const timeModuleArg = encodeTimeArgs(startTime, interval);
  const feeToken = ethers.constants.AddressZero;

  const moduleData: ModuleData = {
    modules: [Module.RESOLVER],
    args: [timeModuleArg],
  };

  const txn = await ops.createTask(
    counter.address,
    execData,
    moduleData,
    feeToken
  );

  const res = await txn.wait();
  console.log(res);

  console.log("Task Submitted");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
