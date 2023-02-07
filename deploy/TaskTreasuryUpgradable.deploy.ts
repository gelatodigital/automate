import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { sleep } from "../hardhat/utils";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const OLD_TREASURY = (await hre.ethers.getContract("TaskTreasuryL2")).address;
  const maxFee = 0;

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
  });
};

export default func;

func.skip = async (hre: HardhatRuntimeEnvironment) => {
  const shouldSkip = hre.network.name !== "hardhat";
  return shouldSkip;
};

func.tags = ["TaskTreasuryUpgradable"];
func.dependencies = ["TaskTreasuryL2"];
