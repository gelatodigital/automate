import { ethers } from "hardhat";
import { Counter, Forwarder, Ops } from "../typechain";

async function main() {
  const [user] = await ethers.getSigners();
  const userAddress = await user.getAddress();
  console.log("User Address: ", userAddress);

  const ops = <Ops>await ethers.getContract("Ops");
  const counter = <Counter>await ethers.getContract("Counter");
  const forwarder = <Forwarder>await ethers.getContract("Forwarder");

  console.log("Submitting Task");

  console.log("Counter address: ", counter.address);

  const selector = await ops.getSelector("increaseCount(uint256)");
  const execData = counter.interface.encodeFunctionData("increaseCount", [100]);
  const resolverData = forwarder.interface.encodeFunctionData("checker", [
    execData,
  ]);

  const interval = 3 * 60;

  const txn = await ops.createTimedTask(
    0,
    interval,
    counter.address,
    selector,
    forwarder.address,
    resolverData,
    ethers.constants.AddressZero,
    true
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
