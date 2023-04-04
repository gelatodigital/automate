import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { sleep } from "../hardhat/utils";
import hre = require("hardhat");
import { getMaxFee } from "../hardhat/config/maxFee";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const OLD_TREASURY =
    hre.network.name === "hardhat"
      ? (await hre.ethers.getContract("TaskTreasuryL2")).address
      : hre.ethers.constants.AddressZero;
  const maxFee =
    hre.network.name === "hardhat" ? getMaxFee(hre.network.name) : 0;

  if (hre.network.name !== "hardhat") {
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
  const shouldSkip = hre.network.name !== "hardhat";
  return shouldSkip;
};

func.tags = ["TaskTreasuryUpgradable"];
func.dependencies = hre.network.name === "hardhat" ? ["TaskTreasuryL2"] : [];
