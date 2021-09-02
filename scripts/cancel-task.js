/* eslint-disable no-undef */
const { ethers } = require("hardhat");

const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

async function main() {
  [user] = await hre.ethers.getSigners();
  userAddress = await user.getAddress();
  console.log("Canceling Task");

  const POKEME = (await hre.ethers.getContract("PokeMe")).address;
  const COUNTER = (await hre.ethers.getContract("Counter")).address;
  const RESOLVER = (await hre.ethers.getContract("CounterResolver")).address;

  const pokeMe = await ethers.getContractAt("PokeMe", POKEME, user);
  const counter = await ethers.getContractAt("Counter", COUNTER, user);
  const resolver = await ethers.getContractAt(
    "CounterResolver",
    RESOLVER,
    user
  );

  const selector = await pokeMe.getSelector("increaseCount(uint256)");

  const resolverData = await resolver.interface.encodeFunctionData("checker");

  const resolverHash = await pokeMe.getResolverHash(
    resolver.address,
    resolverData
  );

  const taskHash = await pokeMe.getTaskId(
    userAddress,
    counter.address,
    selector,
    true,
    ethers.constants.AddressZero,
    resolverHash
  );

  txn = await pokeMe.cancelTask(taskHash);
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
