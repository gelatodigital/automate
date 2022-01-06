const { sleep } = require("@gelatonetwork/core");

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
      `Deploying Counter to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();

  await deploy("Counter", {
    from: deployer,
    args: [(await hre.ethers.getContract("PokeMe")).address],
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

module.exports.tags = ["Counter"];
