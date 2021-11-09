const { sleep } = require("@gelatonetwork/core");
const { getGelatoAddress } = require("../hardhat/config/addresses");
const ethers = require("ethers");

module.exports = async (hre) => {
  const maxFee = ethers.utils.parseEther("0.01");
  const GELATO = getGelatoAddress(hre.network.name);
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
      `Deploying TaskTreasuryL2 to ${hre.network.name}. Hit ctrl + c to abort`
    );
    console.log(
      `Max fee for network ${hre.network.name}: ${ethers.utils.formatEther(
        maxFee
      )} ETH`
    );
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();

  await deploy("TaskTreasuryL2", {
    from: deployer,
    args: [GELATO, maxFee],
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

module.exports.tags = ["TaskTreasuryL2"];
