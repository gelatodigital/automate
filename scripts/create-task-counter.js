const { ethers } = require("hardhat");
const { task } = require("hardhat/config");

const POKEME_ADDRESS = "0xcc9a86297f61203A17F3CffE8686E7eD27c37b3a";
const COUNTER_ADDRESS = "0xf2bd58B64b9b44a4c32E2d20B1A83Bdd559A727e";

async function main() {
  [user] = await hre.ethers.getSigners();
  userAddress = await user.getAddress();
  console.log("User address: ", userAddress);

  const pokeme = await ethers.getContractAt("PokeMe", POKEME_ADDRESS, user);
  const counter = await ethers.getContractAt("Counter", COUNTER_ADDRESS, user);

  let txn = await pokeme.depositFunds(userAddress, {
    value: ethers.utils.parseEther("0.1"),
  });
  await txn.wait();

  const taskData = await counter.interface.encodeFunctionData("increaseCount", [
    1,
  ]);

  txn = await pokeme.createTask(counter.address, taskData);
  await txn.wait();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
