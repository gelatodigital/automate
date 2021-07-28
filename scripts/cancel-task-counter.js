const { ethers } = require("hardhat");

const POKEME_ADDRESS = "0x70921EFA654b7a30CC02279866a9644510726550";
const COUNTER_ADDRESS = "0x2e9823a8790b3eB6B86ec9c6DEdC5db56bc923d2";

async function main() {
  [user] = await hre.ethers.getSigners();
  userAddress = await user.getAddress();
  console.log("User address: ", userAddress);

  const pokeme = await ethers.getContractAt("PokeMe", POKEME_ADDRESS, user);
  const counter = await ethers.getContractAt("Counter", COUNTER_ADDRESS, user);

  let txn = await pokeme.depositFunds(userAddress, {
    value: ethers.utils.parseEther("0.1"),
    gasLimit: 1000000,
    gasPrice: ethers.utils.parseUnits("2", "gwei"),
  });
  let res = await txn.wait();
  console.log(res);

  const taskData = await counter.interface.encodeFunctionData("increaseCount", [
    1,
  ]);

  txn = await pokeme.cancelTask(counter.address, taskData, {
    gasLimit: 1000000,
    gasPrice: ethers.utils.parseUnits("2", "gwei"),
  });
  res = await txn.wait();
  console.log(res);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
