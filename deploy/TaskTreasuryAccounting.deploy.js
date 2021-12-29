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
      `Deploying TaskTreasuryAccounting to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();
  const GELATO = getGelatoAddress(hre.network.name);
  const ORACLE_AGGREGATOR = "0x64f31D46C52bBDe223D863B11dAb9327aB1414E9";
  const TASK_TREASURY = "0x66e2F69df68C8F56837142bE2E8C290EfE76DA9f";

  await deploy("TaskTreasuryAccounting", {
    from: deployer,
    args: [GELATO, ORACLE_AGGREGATOR, TASK_TREASURY],
  });
};

module.exports.skip = async (hre) => {
  const skip = hre.network.name === "mainnet";
  return skip ? true : false;
};

module.exports.tags = ["TaskTreasuryAccounting"];
