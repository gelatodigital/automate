import hre, { getNamedAccounts } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getContract, isTesting, sleep } from "../../src/utils";
import { Automate } from "../../typechain";

const isHardhat = isTesting(hre.network.name);

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (!isTesting(hre.network.name)) {
    console.log(
      `Deploying CounterTestWT to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const accounts = await getNamedAccounts();
  const deployer = isHardhat
    ? accounts["hardhatDeployer"]
    : accounts["deployer"];

  await deploy("CounterTestWT", {
    from: deployer,
    args: [(await getContract<Automate>(hre, "Automate")).address],
  });
};

export default func;

func.skip = async () => {
  return true;
};

func.tags = ["CounterTestWT"];
func.dependencies = ["Automate"];
