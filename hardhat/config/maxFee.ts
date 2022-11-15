/* eslint-disable @typescript-eslint/naming-convention */

import { BigNumber } from "ethers";
import { ethers } from "hardhat";

export const getMaxFee = (network: string): BigNumber => {
  switch (network) {
    case "mainnet":
      return ethers.utils.parseEther("0");
    case "ropsten":
      return ethers.utils.parseEther("0");
    case "rinkeby":
      return ethers.utils.parseEther("0");
    case "goerli":
      return ethers.utils.parseEther("0");
    case "kovan":
      return ethers.utils.parseEther("0");
    case "matic":
      return ethers.utils.parseEther("5");
    case "fantom":
      return ethers.utils.parseEther("50");
    case "avalanche":
      return ethers.utils.parseEther("2");
    case "arbitrum":
      return ethers.utils.parseEther("0.01");
    case "bsc":
      return ethers.utils.parseEther("0.01");
    case "gnosis":
      return ethers.utils.parseEther("2");
    case "mumbai":
      return ethers.utils.parseEther("0");
    case "optimism":
      return ethers.utils.parseEther("0.1");
    case "moonbeam":
      return ethers.utils.parseEther("5");
    case "moonriver":
      return ethers.utils.parseEther("2");
    case "arbgoerli":
      return ethers.utils.parseEther("0");
    case "ogoerli":
      return ethers.utils.parseEther("0");
    case "okovan":
      return ethers.utils.parseEther("0");
    case "cronos":
      return ethers.utils.parseEther("5");
    case "hardhat":
      return ethers.utils.parseEther("100");
    default:
      throw new Error("No maxFee for network");
  }
};
