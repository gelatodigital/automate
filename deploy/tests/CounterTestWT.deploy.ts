import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { sleep } from "../../hardhat/utils";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (hre.network.name !== "hardhat") {
    console.log(
      `Deploying CounterTestWT to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();

  await deploy("CounterTestWT", {
    from: deployer,
    args: [(await hre.ethers.getContract("Ops")).address, deployer],
  });
};

export default func;

func.skip = async () => {
  return true;
};

func.tags = ["CounterTestWT"];
func.dependencies = ["Ops"];
