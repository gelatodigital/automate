const { ethers } = require("hardhat");

const COUNTER = process.env.npm_config_counter;

async function main() {
  const _counterResolver = await ethers.getContractFactory("CounterResolver");

  const counterResolver = await _counterResolver.deploy(COUNTER);
  console.log("Counter Resolver address: ", counterResolver.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
