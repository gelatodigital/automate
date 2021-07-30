const { sleep } = require("@gelatonetwork/core");

module.exports = async (hre) => {
  if (
    hre.network.name === "mainnet" ||
    hre.network.name === "rinkeby" ||
    hre.network.name === "ropsten"
  ) {
    console.log(
      `Deploying CounterResolver to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();

  await deploy("CounterResolver", {
    from: deployer,
    args: [(await hre.ethers.getContract("Counter")).address],
  });
};

module.exports.skip = async (hre) => {
  const skip =
    // hre.network.name === "mainnet" ||
    hre.network.name === "rinkeby" ||
    hre.network.name === "hardhat"; // skip local deployment here for tests to run
  return skip ? true : false;
};

module.exports.tags = ["CounterResolver"];
module.exports.dependencies = ["Counter"];
