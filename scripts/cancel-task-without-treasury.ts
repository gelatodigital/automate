import { ethers } from "hardhat";
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
    false,
    ETH,
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
