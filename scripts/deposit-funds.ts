import { ethers } from "hardhat";
import { TaskTreasuryUpgradable } from "../typechain";

const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

async function main() {
  const [user] = await ethers.getSigners();
  const userAddress = await user.getAddress();
  console.log("User Address: ", userAddress);

  console.log("Depositing funds into treasury");

  const taskTreasury = <TaskTreasuryUpgradable>(
    await ethers.getContract("TaskTreasuryUpgradable")
  );

  const depositAmount = ethers.utils.parseEther("0.1");

  const txn = await taskTreasury.depositFunds(userAddress, ETH, depositAmount, {
    value: depositAmount,
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
