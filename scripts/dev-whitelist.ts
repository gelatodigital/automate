import { ethers } from "hardhat";
import { Ops, TaskTreasuryL2, TaskTreasuryUpgradable } from "../typechain";

const main = async () => {
  const [owner] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();
  console.log("Owner: ", ownerAddress);

  const ops = <Ops>await ethers.getContract("Ops");

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

  await taskTreasury.connect(owner).addWhitelistedService(ops.address);

  console.log("TaskTreasuryL2: Whitelisted Ops");

  await taskTreasuryUpgradable
    .connect(owner)
    .updateWhitelistedService(ops.address, true);

  console.log("TaskTreasuryUpgradable: Whitelisted Ops");
};

main();
