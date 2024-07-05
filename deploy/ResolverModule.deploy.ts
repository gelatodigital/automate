import hre, { deployments, ethers, getNamedAccounts } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { isTesting, sleep } from "../src/utils";

const isHardhat = isTesting(hre.network.name);
const isDevEnv = hre.network.name.endsWith("Dev");
const isDynamicNetwork = hre.network.isDynamic;
const noDeterministicDeployment = hre.network.noDeterministicDeployment;

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (!isTesting(hre.network.name)) {
    console.log(
      `Deploying ResolverModule to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(5000);
  }
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("ResolverModule", {
    from: deployer,
    deterministicDeployment: noDeterministicDeployment
      ? false
      : isDevEnv
      ? ethers.utils.formatBytes32String("ResolverModule-dev")
      : ethers.utils.formatBytes32String("ResolverModule-prod"),

    log: !isTesting(hre.network.name),
  });
};

export default func;

func.skip = async () => {
  if (isDynamicNetwork) {
    return false;
  } else {
    return !isHardhat;
  }
};

func.tags = ["ResolverModule"];
