import { ethers } from "hardhat";
import { getContract, sleep } from "../src/utils";
import { EIP173Proxy } from "../typechain";
import hre = require("hardhat");

export const transferOpsProxyFactoryOwnership = async () => {
  // Get target owner based on IS_TESTNET environment variable
  const getTargetOwner = () => {
    const isTestnet = process.env.IS_TESTNET === 'true';
    return isTestnet
      ? process.env.TESTNET_OWNER_ADDRESS
      : process.env.MAINNET_OWNER_ADDRESS;
  };

  const newOwnerAddress = getTargetOwner();

  if (!newOwnerAddress) {
    console.log("⚠️ No target owner address configured, skipping ownership transfer");
    return;
  }

  const proxyAddress = (
    await getContract<EIP173Proxy>(hre, "OpsProxyFactory_Proxy")
  ).address;
  const ownableInterface = [
    "function transferOwnership(address newOwner) external",
    "function transferProxyAdmin(address newAdmin) external",
  ];

  const proxy = await ethers.getContractAt(ownableInterface, proxyAddress);
  const ownerAddressStorageSlot = await ethers.provider.getStorageAt(
    proxyAddress,
    ethers.BigNumber.from(
      "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
    )
  );
  const ownerAddress = ethers.utils.getAddress(
    "0x" + ownerAddressStorageSlot.substring(26)
  );

  console.log("Current Owner: ", ownerAddress);
  console.log("New Owner: ", newOwnerAddress);

  console.log("Transferring OpsProxyFactory ownership...");
  const txn = await proxy.transferOwnership(newOwnerAddress);
  console.log(`Transfer transaction: ${txn.hash}`);

  const txnReceipt = await txn.wait();
  console.log("✅ OpsProxyFactory ownership transferred successfully");
};

transferOpsProxyFactoryOwnership();
