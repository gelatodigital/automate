const { sleep } = require("@gelatonetwork/core");
const { getOldTaskTreasuryAddress } = require("../hardhat/config/addresses");
const { getMaxFee } = require("../hardhat/config/maxFee");

module.exports = async (hre) => {
  const taskTreasuryAddress = getOldTaskTreasuryAddress(hre.network.name);
  const maxFee = getMaxFee(hre.network.name); // NOTE: Check max fee before deploying

  if (hre.network.name !== "hardhat") {
    console.log(
      `Deploying TaskTreasuryUpgradable to ${hre.network.name}. Hit ctrl + c to abort`
    );
    console.log(`Using Old TaskTreasury: ${taskTreasuryAddress}`);
    console.log(`Max fee: ${maxFee}`);
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();

  await deploy("TaskTreasuryUpgradable", {
    from: deployer,
    proxy: {
      proxyContract: "EIP173ProxyWithCustomReceive",
      owner: deployer,
      execute: {
        init: {
          methodName: "initialize",
          args: [maxFee],
        },
      },
    },
    args: [taskTreasuryAddress],
    log: hre.network.name !== "hardhat" ? true : false,
  });
};

module.exports.skip = async (hre) => {
  const skip = hre.network.name !== "hardhat";
  return skip ? true : false;
};

module.exports.tags = ["TaskTreasuryUpgradable"];
