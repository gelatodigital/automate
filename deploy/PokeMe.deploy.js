const { sleep } = require("@gelatonetwork/core");
const { getGelatoAddress } = require("../hardhat/config/addresses");

module.exports = async (hre) => {
  if (
    hre.network.name === "arbitrum" ||
    hre.network.name === "avalanche" ||
    hre.network.name === "bsc" ||
    hre.network.name === "fantom" ||
    hre.network.name === "goerli" ||
    hre.network.name === "mainnet" ||
    hre.network.name === "matic" ||
    hre.network.name === "rinkeby" ||
    hre.network.name === "ropsten"
  ) {
    console.log(
      `Deploying PokeMe to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();
  const GELATO = getGelatoAddress(hre.network.name);

  await deploy("PokeMe", {
    from: deployer,
    proxy: {
      owner: deployer,
    },
    args: [GELATO, (await hre.ethers.getContract("TaskTreasury")).address],
  });
};

module.exports.skip = async (hre) => {
  const skip =
    hre.network.name === "arbitrum" ||
    hre.network.name === "avalanche" ||
    hre.network.name === "bsc" ||
    hre.network.name === "fantom" ||
    hre.network.name === "goerli" ||
    hre.network.name === "mainnet" ||
    hre.network.name === "matic" ||
    hre.network.name === "rinkeby" ||
    hre.network.name === "ropsten" ||
    hre.network.name === "hardhat"; // skip local deployment here for tests to run
  return skip ? true : false;
};

module.exports.tags = ["PokeMe"];
module.exports.dependencies = ["TaskTreasury"];
