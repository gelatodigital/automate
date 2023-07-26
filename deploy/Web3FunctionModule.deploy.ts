import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { isTesting, sleep } from "../hardhat/utils";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (!isTesting(hre.network.name)) {
    console.log(
      `Deploying Web3FunctionModule to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();

  await deploy("Web3FunctionModule", {
    from: deployer,
    log: !isTesting(hre.network.name),
    gasLimit: 2_000_000,
  });
};

export default func;

func.skip = async (hre: HardhatRuntimeEnvironment) => {
  const shouldSkip = !isTesting(hre.network.name);
  return shouldSkip;
};

func.tags = ["Web3FunctionModule"];
