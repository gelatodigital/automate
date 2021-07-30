const { ethers } = require("hardhat");

const TASK_TREASURY = hre.network.config.TASK_TREASURY;
const ETH = hre.network.config.ETH;

async function main() {
  [user] = await hre.ethers.getSigners();
  userAddress = await user.getAddress();
  console.log("Depositing 0.1 ETH");

  const taskTreasury = await ethers.getContractAt(
    "TaskTreasury",
    TASK_TREASURY,
    user
  );

  const depositAmount = ethers.utils.parseEther("0.1");

  const txn = await taskTreasury.depositFunds(userAddress, ETH, depositAmount, {
    value: depositAmount,
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
