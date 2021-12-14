const { sleep } = require("@gelatonetwork/core");
const { getGelatoAddress } = require("../hardhat/config/addresses");

module.exports = async (hre) => {
  if (
    hre.network.name === "mainnet" ||
    hre.network.name === "rinkeby" ||
    hre.network.name === "ropsten" ||
    hre.network.name === "fantom" ||
    hre.network.name === "matic"
  ) {
    console.log(
      `Deploying TaskTreasury to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();
  const GELATO = getGelatoAddress(hre.network.name);

  await deploy("TaskTreasury", {
    from: deployer,
    args: [GELATO],
  });
};

module.exports.skip = async (hre) => {
  const skip = hre.network.name === "mainnet";
  return skip ? true : false;
};

module.exports.tags = ["TaskTreasury"];
