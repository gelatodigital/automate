import { ethers } from "hardhat";
import { TaskTreasuryUpgradable } from "../typechain";

const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

async function main() {
  const [user] = await ethers.getSigners();
  const userAddress = await user.getAddress();
  console.log("User Address: ", userAddress);

  const taskTreasury = <TaskTreasuryUpgradable>(
    await ethers.getContract("TaskTreasuryUpgradable")
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
