import { ethers } from "hardhat";

/* eslint-disable @typescript-eslint/naming-convention */
export enum Module {
  RESOLVER,
  TIME,
  PROXY,
  SINGLE_EXEC,
  WEB3_FUNCTION,
  TRIGGER,
}

export type ModuleData = {
  modules: Module[];
  args: string[];
};

export const encodeResolverArgs = (
  resolverAddress: string,
  resolverData: string
): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["address", "bytes"],
    [resolverAddress, resolverData]
  );

  return encoded;
};

export const encodeTimeArgs = (startTime: number, interval: number): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["uint128", "uint128"],
    [startTime, interval]
  );

  return encoded;
};

export const encodeTimeTriggerArgs = (
  start: number,
  interval: number
): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["uint128", "uint128"],
    [start, interval]
  );

  return encoded;
};

export const encodeCronTriggerArgs = (expression: string): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(["string"], [expression]);

  return encoded;
};
