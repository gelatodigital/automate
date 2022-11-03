import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { sleep } from "../../hardhat/utils";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (hre.network.name !== "hardhat") {
    console.log(
      `Deploying CounterResolver to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();

  await deploy("CounterResolver", {
    from: deployer,
    args: [(await hre.ethers.getContract("CounterTest")).address],
  });
};

export default func;

func.skip = async (hre: HardhatRuntimeEnvironment) => {
  const shouldSkip = hre.network.name !== "hardhat";
  return shouldSkip;
};

func.tags = ["CounterResolver"];
func.dependencies = ["CounterTest"];
