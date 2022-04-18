/* eslint-disable @typescript-eslint/naming-convention */
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { address as mainnetOps } from "../../deployments/mainnet/Ops.json";
import { address as mainnetTaskTreasury } from "../../deployments/mainnet/TaskTreasury.json";

export const getGelatoAddress = (network: string): string => {
  const GELATO_MAINNET = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
  const GELATO_MATIC = "0x7598e84B2E114AB62CAB288CE5f7d5f6bad35BbA";
  const GELATO_FANTOM = "0xebA27A2301975FF5BF7864b99F55A4f7A457ED10";
  const GELATO_AVALANCHE = "0x7C5c4Af1618220C090A6863175de47afb20fa9Df";
  const GELATO_ARBITRUM = "0x4775aF8FEf4809fE10bf05867d2b038a4b5B2146";
  const GELATO_BSC = "0x7C5c4Af1618220C090A6863175de47afb20fa9Df";
  const GELATO_GNOSIS = "0x29b6603D17B9D8f021EcB8845B6FD06E1Adf89DE";
  const GELATO_OPTIMISM = "0x01051113D81D7d6DA508462F2ad6d7fD96cF42Ef";

  mainnet: {
    gelato: "0x3caca7b48d0573d793d3b0279b5f0029180e83b6",
    oldTreasury: "0x66e2F69df68C8F56837142bE2E8C290EfE76DA9f",
    upgradableTreasury: "0x2807B4aE232b624023f87d0e237A3B1bf200Fd99",
    ops: "0xB3f5503f93d5Ef84b06993a1975B9D21B962892F",
  },

  switch (network) {
    case "mainnet":
      return GELATO_MAINNET;
    case "ropsten":
      return GELATO_ROPSTEN;
    case "rinkeby":
      return GELATO_RINKEBY;
    case "goerli":
      return GELATO_GOERLI;
    case "matic":
      return GELATO_MATIC;
    case "fantom":
      return GELATO_FANTOM;
    case "avalanche":
      return GELATO_AVALANCHE;
    case "arbitrum":
      return GELATO_ARBITRUM;
    case "bsc":
      return GELATO_BSC;
    case "gnosis":
      return GELATO_GNOSIS;
    case "mumbai":
      return GELATO_MUMBAI;
    case "optimism":
      return GELATO_OPTIMISM;
    case "hardhat":
      return GELATO_MAINNET;
    default:
      throw new Error("No gelato address for network");
  }
};

export const getOpsAddress = async (
  hre: HardhatRuntimeEnvironment
): Promise<string> => {
  const network = hre.network.name;

  if (network == "mainnet" || network == "hardhat") return mainnetOps;

  return (await hre.ethers.getContract("Ops")).address;
};

export const getTaskTreasuryAddress = async (
  hre: HardhatRuntimeEnvironment
): Promise<string> => {
  const network = hre.network.name;

  if (network == "mainnet" || network == "hardhat") return mainnetTaskTreasury;
  if (network == "ropsten" || network == "rinkeby" || network == "goerli")
    return (await hre.ethers.getContract("TaskTreasury")).address;

  return (await hre.ethers.getContract("TaskTreasuryL2")).address;
};
