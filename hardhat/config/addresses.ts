/* eslint-disable @typescript-eslint/naming-convention */
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { address as mainnetOps } from "../../deployments/mainnet/Ops.json";

export const getGelatoAddress = (network: string): string => {
  const GELATO_MAINNET = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
  const GELATO_MATIC = "0x7598e84B2E114AB62CAB288CE5f7d5f6bad35BbA";
  const GELATO_FANTOM = "0xebA27A2301975FF5BF7864b99F55A4f7A457ED10";
  const GELATO_AVALANCHE = "0x7C5c4Af1618220C090A6863175de47afb20fa9Df";
  const GELATO_ARBITRUM = "0x4775aF8FEf4809fE10bf05867d2b038a4b5B2146";
  const GELATO_BSC = "0x7C5c4Af1618220C090A6863175de47afb20fa9Df";
  const GELATO_GNOSIS = "0x29b6603D17B9D8f021EcB8845B6FD06E1Adf89DE";
  const GELATO_OPTIMISM = "0x01051113D81D7d6DA508462F2ad6d7fD96cF42Ef";
  const GELATO_MOONBEAM = "0x91f2A140cA47DdF438B9c583b7E71987525019bB";
  const GELATO_MOONRIVER = "0x91f2A140cA47DdF438B9c583b7E71987525019bB";
  const GELATO_CRONOS = "0x91f2A140cA47DdF438B9c583b7E71987525019bB";

  const GELATO_ROPSTEN = "0xCc4CcD69D31F9FfDBD3BFfDe49c6aA886DaB98d9";
  const GELATO_RINKEBY = "0x0630d1b8C2df3F0a68Df578D02075027a6397173";
  const GELATO_GOERLI = "0x683913B3A32ada4F8100458A3E1675425BdAa7DF";
  const GELATO_KOVAN = "0xDf592cB2d32445F8e831d211AB20D3233cA41bD8";
  const GELATO_MUMBAI = "0x25aD59adbe00C2d80c86d01e2E05e1294DA84823";
  const GELATO_AGOERLI = "0xF82D64357D9120a760e1E4C75f646C0618eFc2F3";
  const GELATO_OGOERLI = "0xF82D64357D9120a760e1E4C75f646C0618eFc2F3";
  const GELATO_OKOVAN = "0x91f2A140cA47DdF438B9c583b7E71987525019bB";

  switch (network) {
    case "mainnet":
      return GELATO_MAINNET;
    case "ropsten":
      return GELATO_ROPSTEN;
    case "rinkeby":
      return GELATO_RINKEBY;
    case "goerli":
      return GELATO_GOERLI;
    case "kovan":
      return GELATO_KOVAN;
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
    case "moonbeam":
      return GELATO_MOONBEAM;
    case "moonriver":
      return GELATO_MOONRIVER;
    case "arbgoerli":
      return GELATO_AGOERLI;
    case "ogoerli":
      return GELATO_OGOERLI;
    case "okovan":
      return GELATO_OKOVAN;
    case "cronos":
      return GELATO_CRONOS;
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

  if (
    network == "mainnet" ||
    network == "ropsten" ||
    network == "rinkeby" ||
    network == "goerli"
  )
    return (await hre.ethers.getContract("TaskTreasury")).address;

  return (await hre.ethers.getContract("TaskTreasuryL2")).address;
};
