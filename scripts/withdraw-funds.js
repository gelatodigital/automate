/* eslint-disable no-undef */
const { ethers } = require("hardhat");

const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

async function main() {
  [user] = await hre.ethers.getSigners();
  userAddress = await user.getAddress();
  console.log("Withdrawing remaining ETH");

  const TASK_TREASURY = (await hre.ethers.getContract("TaskTreasury")).address;

  const taskTreasury = await ethers.getContractAt(
    "TaskTreasury",
    TASK_TREASURY,
    user
  );

  const remainingBalance = await taskTreasury.userTokenBalance(
    userAddress,
    ETH
  );
  const txn = await taskTreasury.withdrawFunds(
    userAddress,
    ETH,
    remainingBalance
  );

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
