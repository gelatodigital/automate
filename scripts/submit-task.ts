import { ethers } from "hardhat";
import { encodeResolverArgs, Module, ModuleData } from "../test/utils";
import { Counter, CounterResolver, Ops } from "../typechain";

async function main() {
  const [user] = await ethers.getSigners();
  const userAddress = await user.getAddress();
  console.log("User Address: ", userAddress);

  const ops = <Ops>await ethers.getContract("Ops");
  const counter = <Counter>await ethers.getContract("Counter");
  const resolver = <CounterResolver>await ethers.getContract("CounterResolver");

  console.log("Submitting Task");

  console.log("Counter address: ", counter.address);
  console.log("Counter resolver address: ", resolver.address);

  const execSelector = counter.interface.getSighash("increaseCount");
  const resolverData = resolver.interface.encodeFunctionData("checker");
  const resolverModuleArg = encodeResolverArgs(resolver.address, resolverData);
  const feeToken = ethers.constants.AddressZero;

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
