import { ethers } from "hardhat";
import { Counter, CounterResolver, Ops } from "../typechain";

async function main() {
  const [user] = await ethers.getSigners();
  const userAddress = await user.getAddress();
  console.log("User Address: ", userAddress);

  console.log("Canceling Task");

  const ops = <Ops>await ethers.getContract("Ops");
  const counter = <Counter>await ethers.getContract("Counter");
  const resolver = <CounterResolver>await ethers.getContract("CounterResolver");

  const selector = await ops.getSelector("increaseCount(uint256)");

  const resolverData = resolver.interface.encodeFunctionData("checker");

  const resolverHash = await ops.getResolverHash(
    resolver.address,
    resolverData
  );

  const taskHash = await ops.getTaskId(
    userAddress,
    counter.address,
    selector,
    true,
    ethers.constants.AddressZero,
    resolverHash
  );

  const txn = await ops.cancelTask(taskHash);
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
