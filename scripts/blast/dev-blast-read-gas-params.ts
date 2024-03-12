import { ethers } from "hardhat";

export const readGasParams = async () => {
  const [owner] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();
  console.log("Owner: ", ownerAddress);

  const automateAddress = (await ethers.getContract("Automate")).address;

  const blastAbi = [
    "function readGasParams(address contractAddress) external view returns (uint256 etherSeconds, uint256 etherBalance, uint256 lastUpdated, uint8)",
  ];
  const blastAddress = "0x4300000000000000000000000000000000000002";

  const blast = await ethers.getContractAt(blastAbi, blastAddress);

  const result = await blast.readGasParams(automateAddress);

  console.log(
    `Balance: ${result.etherBalance.toString()}. LastUpdated: ${result.lastUpdated.toString()}`
  );
};

readGasParams();
