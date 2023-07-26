import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { isTesting, sleep } from "../hardhat/utils";
import { getGelatoAddress } from "../hardhat/config/addresses";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (!isTesting(hre.network.name)) {
    console.log(
      `Deploying TaskTreasury to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();

  const GELATO = getGelatoAddress(hre.network.name);

  await deploy("TaskTreasury", {
    from: deployer,
    args: [GELATO],
    log: !isTesting(hre.network.name),
  });
};

export default func;

func.skip = async (hre: HardhatRuntimeEnvironment) => {
  const shouldSkip = !isTesting(hre.network.name);
  return shouldSkip;
};

func.tags = ["TaskTreasury"];
