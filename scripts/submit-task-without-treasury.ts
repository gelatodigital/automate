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

  const selector = await ops.getSelector("increaseCount(uint256)");
  const resolverData = await ops.getSelector("checker()");

  const txn = await ops.createTaskNoPrepayment(
    counter.address,
    selector,
    resolver.address,
    resolverData,
    ETH
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
