const { sleep } = require("@gelatonetwork/core");

module.exports = async (hre) => {
  if (
    hre.network.name === "mainnet" ||
    hre.network.name === "rinkeby" ||
    hre.network.name === "ropsten" ||
    hre.network.name === "fantom" ||
    hre.network.name === "matic"
  ) {
    console.log(
      `Deploying CounterResolverWithoutTreasury to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();

  await deploy("CounterResolverWithoutTreasury", {
    from: deployer,
    args: [(await hre.ethers.getContract("CounterWithoutTreasury")).address],
  });
};

module.exports.skip = async (hre) => {
  const skip = hre.network.name === "mainnet";
  return skip ? true : false;
};

module.exports.tags = ["CounterResolverWithoutTreasury"];
module.exports.dependencies = ["CounterWithoutTreasury"];
