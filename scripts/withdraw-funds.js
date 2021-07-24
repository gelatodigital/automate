const { ethers } = require("hardhat");

const POKEME_ADDRESS = hre.network.config.POKEME_ADDRESS;

async function main() {
  [user] = await hre.ethers.getSigners();
  userAddress = await user.getAddress();
  console.log("Withdrawing funds");

  const pokeme = await ethers.getContractAt("PokeMe", POKEME_ADDRESS, user);
  const balance = await pokeme.balanceOfCallee(userAddress);

  const txn = await pokeme.withdrawFunds(balance, {
    gasLimit: 1000000,
    gasPrice: ethers.utils.parseUnits("2", "gwei"),
  });
  const res = await txn.wait();
  console.log(res);
  console.log("Funds withdrawn");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
