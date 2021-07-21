const { ethers } = require("hardhat");

const gelatoAddress = "0xCc4CcD69D31F9FfDBD3BFfDe49c6aA886DaB98d9";

async function main() {
  const _PokeMe = await hre.ethers.getContractFactory("PokeMe");
  const _counter = await ethers.getContractFactory("Counter");

  const PokeMe = await _PokeMe.deploy(gelatoAddress);
  console.log("PokeMe address: ", PokeMe.address);

  const counter = await _counter.deploy();
  console.log("Counter address: ", counter.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
