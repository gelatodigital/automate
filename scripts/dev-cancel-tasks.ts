import { ethers } from "hardhat";
import { sleep } from "../hardhat/utils";
import { ILegacyOps } from "../typechain";

const main = async () => {
  const [owner] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();
  console.log("Owner: ", ownerAddress);

  const ops = <ILegacyOps>await ethers.getContract("Ops");

  const taskIds = await ops.getTaskIdsByUser(ownerAddress);

  for (const taskId of taskIds) {
    (await ops.cancelTask(taskId)).wait();
    console.log("Canceled: ", taskId);
    await sleep(5000);
  }
};

main();
