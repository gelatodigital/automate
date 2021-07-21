const { ethers } = require("hardhat");
const GELATO = "0xCc4CcD69D31F9FfDBD3BFfDe49c6aA886DaB98d9";

async function main() {
  const _PokeMe = await hre.ethers.getContractFactory("PokeMe");
  const _counter = await ethers.getContractFactory("Counter");
  const _resolver = await ethers.getContractFactory("Resolver");

  const PokeMe = await _PokeMe.deploy(
    ethers.utils.parseEther("0.0001"),
    GELATO
  );
  await PokeMe.deployed();
  console.log("PokeMe address: ", PokeMe.address);

  const counter = await _counter.deploy();
  await counter.deployed();
  console.log("Counter address: ", counter.address);

  const resolver = await _resolver.deploy(counter.address);
  await resolver.deployed();
  console.log("Resolver address: ", resolver.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
