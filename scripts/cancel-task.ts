import { ethers } from "hardhat";
import {
  encodeResolverArgs,
  getTaskId,
  Module,
  ModuleData,
} from "../test/utils";
import { Counter, CounterResolver, Ops } from "../typechain";

async function main() {
  const [user] = await ethers.getSigners();
  const userAddress = await user.getAddress();
  console.log("User Address: ", userAddress);

  console.log("Canceling Task");

  const ops = <Ops>await ethers.getContract("Ops");
  const counter = <Counter>await ethers.getContract("Counter");
  const resolver = <CounterResolver>await ethers.getContract("CounterResolver");

  const execSelector = counter.interface.getSighash("increaseCount");
  const resolverData = resolver.interface.encodeFunctionData("checker");
  const resolverModuleArg = encodeResolverArgs(resolver.address, resolverData);
  const feeToken = ethers.constants.AddressZero;

  const moduleData: ModuleData = {
    modules: [Module.RESOLVER],
    args: [resolverModuleArg],
  };

  const taskId = getTaskId(
    userAddress,
    counter.address,
    execSelector,
    moduleData,
    feeToken
  );

  const txn = await ops.cancelTask(taskId);
  const res = await txn.wait();
  console.log(res);

  console.log("Task Canceled");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
