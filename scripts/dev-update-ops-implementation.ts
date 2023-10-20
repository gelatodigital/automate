import { ethers } from "hardhat";
import { sleep } from "../hardhat/utils";
import { EIP173Proxy } from "../typechain";

const main = async () => {
  const [owner] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();
  console.log("Owner: ", ownerAddress);

  const proxy = (await ethers.getContract("Automate_Proxy")) as EIP173Proxy;
  const implementation = await ethers.getContract("Automate_Implementation");

  console.log("proxy: ", proxy.address);
  console.log("implementation: ", implementation.address);
  await sleep(10000);
  await proxy.upgradeTo(implementation.address);
};

main();
