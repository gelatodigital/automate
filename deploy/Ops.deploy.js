const { sleep } = require("@gelatonetwork/core");
const { addresses } = require("../hardhat/config/addresses");

module.exports = async (hre) => {
  if (hre.network.name !== "hardhat") {
    console.log(`Deploying Ops to ${hre.network.name}. Hit ctrl + c to abort`);
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();

  const address = addresses[hre.network.name];

  const GELATO = address.gelato;
  const UPGRADABLE_TREASURY = (
    await hre.ethers.getContract("TaskTreasuryUpgradable")
  ).address;
  const OPS_PROXY_FACTORY = (await hre.ethers.getContract("OpsProxyFactory"))
    .address;

  await deploy("Ops", {
    from: deployer,
    proxy: {
      owner: deployer,
    },
    args: [GELATO, UPGRADABLE_TREASURY, OPS_PROXY_FACTORY],
  });
};

module.exports.skip = async (hre) => {
  const skip = hre.network.name !== "hardhat";
  return skip ? true : false;
};

module.exports.tags = ["Ops"];
module.exports.dependencies = ["TaskTreasuryUpgradable", "OpsProxyFactory"];
