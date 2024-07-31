import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import hre, { deployments, getNamedAccounts } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { isTesting, sleep } from "../src/utils";

const isHardhat = isTesting(hre.network.name);
const isDevEnv = hre.network.name.endsWith("Dev");
const isDynamicNetwork = hre.network.isDynamic;
// eslint-disable-next-line @typescript-eslint/naming-convention
const noDeterministicDeployment = hre.network.noDeterministicDeployment;

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (!isTesting(hre.network.name)) {
    console.log(
      `Deploying Web3FunctionModule to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(5000);
  }
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("Web3FunctionModule", {
    from: deployer,
    deterministicDeployment: noDeterministicDeployment
      ? false
      : isDevEnv
      ? keccak256(toUtf8Bytes("Web3FunctionModule-dev"))
      : keccak256(toUtf8Bytes("Web3FunctionModule-prod")),
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

func.tags = ["Web3FunctionModule"];
