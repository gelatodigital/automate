const { getGelatoAddress } = require("../hardhat/config/addresses");

const main = async () => {
  const GELATO = getGelatoAddress(hre.network.name);

  try {
    await hre.run("verify:verify", {
      address: (await hre.ethers.getContract("TaskTreasuryFantom")).address,
      constructorArguments: [GELATO],
      contract: "contracts/TaskTreasuryFantom.sol:TaskTreasuryFantom",
    });
  } catch {
    console.log("Already Verified");
  }

  try {
    await hre.run("verify:verify", {
      address: (await hre.ethers.getContract("PokeMe")).address,
      constructorArguments: [
        GELATO,
        (await hre.ethers.getContract("TaskTreasuryFantom")).address,
      ],
    });
  } catch {
    console.log("Already Verified");
  }
};

main();
