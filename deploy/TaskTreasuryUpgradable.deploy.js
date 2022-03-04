const { sleep } = require("@gelatonetwork/core");

module.exports = async (hre) => {
  const TASKTREASURY = "0x66e2f69df68c8f56837142be2e8c290efe76da9f";

  if (hre.network.name !== "hardhat") {
    console.log(
      `Deploying TaskTreasuryUpgradable to ${hre.network.name}. Hit ctrl + c to abort`
    );
    console.log(`Using Old TaskTreasury: ${TASKTREASURY}`);
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
          args: [],
        },
      },
    },
    args: [TASKTREASURY],
    log: hre.network.name !== "hardhat" ? true : false,
  });
};

module.exports.skip = async (hre) => {
  const skip = hre.network.name !== "hardhat";
  return skip ? true : false;
};

module.exports.tags = ["TaskTreasuryUpgradable"];
module.exports.dependencies = ["TaskTreasury"];
