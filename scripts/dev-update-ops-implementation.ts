import { ethers } from "hardhat";
import { sleep } from "../hardhat/utils";
import { EIP173Proxy } from "../typechain";

const main = async () => {
  const [owner] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();
  console.log("Owner: ", ownerAddress);

  const proxy = <EIP173Proxy>await ethers.getContract("Ops");
  const implementation = <EIP173Proxy>(
    await ethers.getContract("Ops_Implementation")
  );

  console.log("implementation", implementation.address);
  await sleep(10000);
  await proxy.upgradeTo(implementation.address);
};

main();
