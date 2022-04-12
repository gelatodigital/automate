const { sleep } = require("@gelatonetwork/core");
const { getGelatoAddress } = require("../hardhat/config/addresses");

module.exports = async (hre) => {
  if (hre.network.name !== "hardhat") {
    console.log(`Deploying Ops to ${hre.network.name}. Hit ctrl + c to abort`);
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();
  const GELATO = getGelatoAddress(hre.network.name);

  await deploy("Ops", {
    from: deployer,
    proxy: {
      owner: deployer,
    },
    args: [
      GELATO,
      (await hre.ethers.getContract("TaskTreasuryUpgradable")).address,
    ],
  });
};

module.exports.skip = async (hre) => {
  const skip = hre.network.name !== "hardhat";
  return skip ? true : false;
};

module.exports.tags = ["Ops"];
module.exports.dependencies = ["TaskTreasuryUpgradable"];
