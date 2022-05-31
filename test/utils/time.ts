import { ethers } from "hardhat";
import hre = require("hardhat");

import * as dotenv from "dotenv";
const config = dotenv.config();
const ALCHEMY_ID = config?.parsed?.ALCHEMY_ID;

export const fastForwardTime = async (seconds: number) => {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
};

export const getTimeStampNow = async (): Promise<number> => {
  return (await ethers.provider.getBlock("latest")).timestamp;
};

export const setupFork = async (blockNumber: number) => {
  await hre.network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
          blockNumber,
        },
      },
    ],
  });
};
