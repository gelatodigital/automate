const { sleep } = require("@gelatonetwork/core");

module.exports = async (hre) => {
  if (hre.network.name !== "hardhat") {
    console.log(
      `Deploying Counter to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();

  await deploy("Counter", {
    from: deployer,
    args: [(await hre.ethers.getContract("PokeMe")).address],
  });
};

module.exports.skip = async (hre) => {
  const skip = hre.network.name !== "hardhat";
  return skip ? true : false;
};

module.exports.tags = ["Counter"];
module.exports.dependencies = ["PokeMe"];
