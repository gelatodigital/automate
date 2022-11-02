import { ethers } from "hardhat";
import {
  encodeResolverArgs,
  getTaskId,
  Module,
  ModuleData,
} from "../test/utils";
import {
  CounterWithoutTreasury,
  CounterResolverWithoutTreasury,
  Ops,
} from "../typechain";

const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

async function main() {
  const [user] = await ethers.getSigners();
  const userAddress = await user.getAddress();
  console.log("User Address: ", userAddress);

  console.log("Canceling Task");

  const ops = <Ops>await ethers.getContract("Ops");
  const counter = <CounterWithoutTreasury>(
    await ethers.getContract("CounterWithoutTreasury")
  );
  const resolver = <CounterResolverWithoutTreasury>(
    await ethers.getContract("CounterResolverWithoutTreasury")
  );

  const execSelector = counter.interface.getSighash("increaseCount");
  const resolverData = resolver.interface.encodeFunctionData("checker");
  const resolverModuleArg = encodeResolverArgs(resolver.address, resolverData);
  const feeToken = ETH;

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
