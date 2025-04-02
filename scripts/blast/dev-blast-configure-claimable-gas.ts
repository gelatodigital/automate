import { ethers } from "hardhat";
import { Automate } from "../../typechain";

export const configureClaimableGas = async () => {
  const [owner] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();
  console.log("Owner: ", ownerAddress);

  const automateAddress = (await ethers.getContract("Automate")).address;
  const automate = <Automate>(
    await ethers.getContractAt("Automate", automateAddress)
  );

  const txn = await automate.configureClaimableGas();
  const receipt = await txn.wait();

  console.log(`Configured claimable gas in ${receipt.transactionHash}`);
};

configureClaimableGas();
