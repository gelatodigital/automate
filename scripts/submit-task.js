/* eslint-disable no-undef */
const { ethers } = require("hardhat");

async function main() {
  [user] = await hre.ethers.getSigners();
  userAddress = await user.getAddress();
  const COUNTER = (await hre.ethers.getContract("Counter")).address;
  const RESOLVER = (await hre.ethers.getContract("CounterResolver")).address;

  console.log("Submitting Task");

  console.log("Counter address: ", COUNTER);
  console.log("Counter resolver address: ", RESOLVER);

  const OPS = (await hre.ethers.getContract("Ops")).address;

  const ops = await ethers.getContractAt("Ops", OPS, user);
  const counter = await ethers.getContractAt("Counter", COUNTER, user);
  const counterResolver = await ethers.getContractAt(
    "CounterResolver",
    RESOLVER,
    user
  );

  const selector = await ops.getSelector("increaseCount(uint256)");
  const resolverData = await ops.getSelector("checker()");

  const txn = await ops.createTask(
    counter.address,
    selector,
    counterResolver.address,
    resolverData
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
