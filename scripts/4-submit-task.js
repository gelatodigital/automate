const { ethers } = require("hardhat");

const COUNTER = process.env.npm_config_counter;
const RESOLVER = process.env.npm_config_resolver;

async function main() {
  [user] = await hre.ethers.getSigners();
  userAddress = await user.getAddress();
  console.log("Submitting Task");

  console.log("Counter address: ", COUNTER);
  console.log("Counter resolver address: ", RESOLVER);

  const POKEME = (await hre.ethers.getContract("PokeMe")).address;

  const pokeMe = await ethers.getContractAt("PokeMe", POKEME, user);
  const counter = await ethers.getContractAt("Counter", COUNTER, user);
  const counterResolver = await ethers.getContractAt(
    "CounterResolver",
    RESOLVER,
    user
  );

  const selector = await pokeMe.getSelector("increaseCount(uint256)");
  const resolverData = await pokeMe.getSelector("checker()");

  const txn = await pokeMe.createTask(
    counter.address,
    selector,
    counterResolver.address,
    resolverData,
    {
      gasLimit: 1000000,
      gasPrice: ethers.utils.parseUnits("2", "gwei"),
    }
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
