const { sleep } = require("@gelatonetwork/core");
const { getGelatoAddress } = require("../hardhat/config/addresses");

module.exports = async (hre) => {
  if (hre.network.name !== "hardhat") {
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
  const skip = hre.network.name !== "hardhat";
  return skip ? true : false;
};

module.exports.tags = ["TaskTreasury"];
