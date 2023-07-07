import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { isTesting, sleep } from "../hardhat/utils";
import { getGelatoAddress } from "../hardhat/config/addresses";
import { ethers } from "hardhat";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const maxFee = 0;
  const GELATO = getGelatoAddress(hre.network.name);

  if (!isTesting(hre.network.name)) {
    console.log(
      `Deploying TaskTreasuryL2 to ${hre.network.name}. Hit ctrl + c to abort`
    );
    console.log(
      `Max fee for network ${hre.network.name}: ${ethers.utils.formatEther(
        maxFee
      )} ETH`
    );

    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();

  await deploy("TaskTreasuryL2", {
    from: deployer,
    args: [GELATO, maxFee],
    log: !isTesting(hre.network.name),
  });
};

export default func;

func.skip = async (hre: HardhatRuntimeEnvironment) => {
  const shouldSkip = !isTesting(hre.network.name);
  return shouldSkip;
};

func.tags = ["TaskTreasuryL2"];
