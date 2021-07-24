const { ethers } = require("hardhat");

const POKEME_ADDRESS = hre.network.config.POKEME_ADDRESS;

async function main() {
  [user] = await hre.ethers.getSigners();
  userAddress = await user.getAddress();
  console.log("Depositing 0.1 ETH");

  const pokeme = await ethers.getContractAt("PokeMe", POKEME_ADDRESS, user);

  const txn = await pokeme.depositFunds(userAddress, {
    value: ethers.utils.parseEther("0.1"),
    gasLimit: 1000000,
    gasPrice: ethers.utils.parseUnits("2", "gwei"),
  });
  const res = await txn.wait();
  console.log(res);

  console.log("Funds deposited");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
