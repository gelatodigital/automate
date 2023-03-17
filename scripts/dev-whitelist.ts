import { ethers } from "hardhat";
import { Automate, TaskTreasuryL2, TaskTreasuryUpgradable } from "../typechain";

const main = async () => {
  const [owner] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();
  console.log("Owner: ", ownerAddress);

  const automate = <Automate>await ethers.getContract("Automate");

  const taskTreasury = <TaskTreasuryL2>(
    await ethers.getContract("TaskTreasuryL2")
  );

  const taskTreasuryUpgradable = <TaskTreasuryUpgradable>(
    await ethers.getContract("TaskTreasuryUpgradable")
  );

  await taskTreasury
    .connect(owner)
    .addWhitelistedService(taskTreasuryUpgradable.address);

  console.log("TaskTreasuryL2: Whitelisted TaskTreasuryUpgradable");

  await taskTreasury.connect(owner).addWhitelistedService(automate.address);

  console.log("TaskTreasuryL2: Whitelisted Automate");

  await taskTreasuryUpgradable
    .connect(owner)
    .updateWhitelistedService(automate.address, true);

  console.log("TaskTreasuryUpgradable: Whitelisted Automate");
};

main();
