import { ethers } from "hardhat";
import { Automate, TaskTreasuryUpgradable } from "../typechain";

const main = async () => {
  const [owner] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();
  console.log("Owner: ", ownerAddress);

  const automate = <Automate>await ethers.getContract("Automate");

  const taskTreasuryUpgradable = <TaskTreasuryUpgradable>(
    await ethers.getContract("TaskTreasuryUpgradable")
  );

  await taskTreasuryUpgradable
    .connect(owner)
    .updateWhitelistedService(automate.address, true);

  console.log("TaskTreasuryUpgradable: Whitelisted Automate");
};

main();
