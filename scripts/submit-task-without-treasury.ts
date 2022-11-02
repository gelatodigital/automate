import { ethers } from "hardhat";
import { encodeResolverArgs, Module, ModuleData } from "../test/utils";
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

  const counter = <CounterWithoutTreasury>(
    await ethers.getContract("CounterWithoutTreasury")
  );
  const resolver = <CounterResolverWithoutTreasury>(
    await ethers.getContract("CounterResolverWithoutTreasury")
  );

  console.log("Sending ETH to Counter");
  const depositAmount = ethers.utils.parseEther("0.05");

  await user.sendTransaction({
    to: counter.address,
    value: depositAmount,
  });

  console.log("Submitting Task");

  console.log("Counter address: ", counter.address);
  console.log("Counter resolver address: ", resolver.address);

  const ops = <Ops>await ethers.getContract("Ops");

  const execSelector = counter.interface.getSighash("increaseCount");
  const resolverData = resolver.interface.encodeFunctionData("checker");
  const resolverModuleArg = encodeResolverArgs(resolver.address, resolverData);
  const feeToken = ETH;

  const moduleData: ModuleData = {
    modules: [Module.RESOLVER],
    args: [resolverModuleArg],
  };

  const txn = await ops.createTask(
    counter.address,
    execSelector,
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
