const { ethers } = require("hardhat");

async function main() {
  const _counter = await ethers.getContractFactory("Counter");

  const counter = await _counter.deploy();
  console.log("Counter address: ", counter.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
