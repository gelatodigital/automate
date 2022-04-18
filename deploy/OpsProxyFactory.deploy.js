const { sleep } = require("@gelatonetwork/core");
const { addresses } = require("../hardhat/config/addresses");

module.exports = async (hre) => {
  if (hre.network.name !== "hardhat") {
    console.log(
      `Deploying OpsProxyFactory to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();

  const address = addresses[hre.network.name];
  const OPS = address.ops;

  await deploy("OpsProxyFactory", {
    from: deployer,
    args: [OPS],
  });
};

module.exports.skip = async (hre) => {
  const skip = hre.network.name !== "hardhat";
  return skip ? true : false;
};

module.exports.tags = ["OpsProxyFactory"];
