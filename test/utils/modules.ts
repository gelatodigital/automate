import { ethers } from "hardhat";

/* eslint-disable @typescript-eslint/naming-convention */
export enum Module {
  RESOLVER,
  TIME,
  PROXY,
  SINGLE_EXEC,
  ORESOLVER,
  WEB3_FUNCTION,
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

export const encodeOResolverArgs = (
  oResolverHash: string,
  oResolverArgsHex: string
): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["string", "bytes"],
    [oResolverHash, oResolverArgsHex]
  );

  return encoded;
};
