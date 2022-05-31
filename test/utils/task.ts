import { ethers } from "hardhat";
import { ModuleData } from "./modules";

export const getTaskId = (
  taskCreator: string,
  execAddress: string,
  execSelector: string,
  moduleData: ModuleData,
  feeToken: string
): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "bytes4", "tuple(uint8[], bytes[])", "address"],
    [
      taskCreator,
      execAddress,
      execSelector,
      [moduleData.modules, moduleData.args],
      feeToken,
    ]
  );

  const taskId = ethers.utils.keccak256(encoded);
  return taskId;
};

export const getLegacyTaskId = (
  taskCreator: string,
  execAddress: string,
  execSelector: string,
  useTaskTreasuryFunds: boolean,
  feeToken: string,
  resolverHash: string
): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "bytes4", "bool", "address", "bytes32"],
    [
      taskCreator,
      execAddress,
      execSelector,
      useTaskTreasuryFunds,
      feeToken,
      resolverHash,
    ]
  );

  const taskId = ethers.utils.keccak256(encoded);
  return taskId;
};

export const getResolverHash = (
  resolverAddress: string,
  resolverData: string
): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["address", "bytes"],
    [resolverAddress, resolverData]
  );

  const hash = ethers.utils.keccak256(encoded);
  return hash;
};

export const getSelector = (func: string): string => {
  const funcBytes = ethers.utils.toUtf8Bytes(func);
  const hash = ethers.utils.keccak256(funcBytes);
  const selector = hash.substring(0, 10);
  return selector;
};
