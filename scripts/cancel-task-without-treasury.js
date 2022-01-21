/* eslint-disable no-undef */
const { ethers } = require("hardhat");

const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

async function main() {
  [user] = await hre.ethers.getSigners();
  userAddress = await user.getAddress();
  console.log("Canceling Task");

  const POKEME = (await hre.ethers.getContract("Ops")).address;
  const COUNTER = (await hre.ethers.getContract("CounterWithoutTreasury"))
    .address;
  const RESOLVER = (
    await hre.ethers.getContract("CounterResolverWithoutTreasury")
  ).address;

  const ops = await ethers.getContractAt("Ops", POKEME, user);
  const counter = await ethers.getContractAt(
    "CounterWithoutTreasury",
    COUNTER,
    user
  );
  const resolver = await ethers.getContractAt(
    "CounterResolverWithoutTreasury",
    RESOLVER,
    user
  );

  const selector = await ops.getSelector("increaseCount(uint256)");

  const resolverData = await resolver.interface.encodeFunctionData("checker");

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

  txn = await ops.cancelTask(taskHash);
  res = await txn.wait();
  console.log(res);

  console.log("Task Canceled");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
