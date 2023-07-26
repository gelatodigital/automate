import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { isTesting, sleep } from "../hardhat/utils";
import hre = require("hardhat");

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const OLD_TREASURY = isTesting(hre.network.name)
    ? (await hre.ethers.getContract("TaskTreasuryL2")).address
    : hre.ethers.constants.AddressZero;
  const maxFee = 0;

  if (!isTesting(hre.network.name)) {
    console.log(
      `Deploying TaskTreasuryUpgradable to ${hre.network.name}. Hit ctrl + c to abort`
    );
    console.log(`Using Old TaskTreasury: ${OLD_TREASURY}`);
    console.log(`Max fee: ${maxFee}`);
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();

  await deploy("TaskTreasuryUpgradable", {
    from: deployer,
    proxy: {
      proxyContract: "EIP173ProxyWithCustomReceive",
      owner: deployer,
      execute: {
        init: {
          methodName: "initialize",
          args: [maxFee],
        },
      },
    },
    args: [OLD_TREASURY],
    log: hre.network.name !== "hardhat",
    gasLimit: 5_000_000,
  });
};

export default func;

func.skip = async (hre: HardhatRuntimeEnvironment) => {
  const shouldSkip = !isTesting(hre.network.name);
  return shouldSkip;
};

func.tags = ["TaskTreasuryUpgradable"];
func.dependencies = isTesting(hre.network.name) ? ["TaskTreasuryL2"] : [];
