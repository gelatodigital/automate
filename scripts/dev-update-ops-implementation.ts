import { ethers } from "hardhat";
import { getContract, sleep } from "../src/utils";
import { Automate, EIP173Proxy } from "../typechain";
import hre = require("hardhat");

const main = async () => {
  const [owner] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();
  console.log("Owner: ", ownerAddress);

  const proxy = await getContract<EIP173Proxy>(hre, "Automate_Proxy");
  const implementation = await getContract<Automate>(
    hre,
    "Automate_Implementation"
  );

  console.log("proxy: ", proxy.address);
  console.log("implementation: ", implementation.address);
  await sleep(10000);
  await proxy.upgradeTo(implementation.address);
};

main();
