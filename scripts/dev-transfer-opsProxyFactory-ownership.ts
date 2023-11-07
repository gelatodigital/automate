import { ethers } from "hardhat";
import { sleep } from "../hardhat/utils";

export const transferOpsProxyFactoryOwnership = async () => {
  const newOwnerAddress = ""; // fill with your own owner address

  if (!newOwnerAddress) {
    throw new Error(`No owner address defined`);
  }

  const proxyAddress = (await ethers.getContract("OpsProxyFactory_Proxy"))
    .address;
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

  await sleep(10000);

  // const txn = await automateProxy.transferProxyAdmin(newOwnerAddress);
  const txn = await proxy.transferOwnership(newOwnerAddress);

  const txnReceipt = await txn.wait();
  console.log(txnReceipt);
};

transferOpsProxyFactoryOwnership();
