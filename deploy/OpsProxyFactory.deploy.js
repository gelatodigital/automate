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
  const OPSPROXY = (await hre.ethers.getContract("OpsProxy")).address;

  await deploy("OpsProxyFactory", {
    from: deployer,
    proxy: {
      proxyContract: "EIP173Proxy",
      owner: deployer,
      execute: {
        init: {
          methodName: "initialize",
          args: [OPSPROXY],
        },
      },
    },
    args: [OPS],
  });
};

module.exports.skip = async (hre) => {
  const skip = hre.network.name !== "hardhat";
  return skip ? true : false;
};

module.exports.tags = ["OpsProxyFactory"];
module.exports.dependencies = ["OpsProxy"];
