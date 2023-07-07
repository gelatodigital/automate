import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { isTesting, isZksync, sleep } from "../hardhat/utils";
import { getGelatoAddress } from "../hardhat/config/addresses";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (!isTesting(hre.network.name)) {
    console.log(
      `Deploying Automate to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();

  const GELATO = getGelatoAddress(hre.network.name);
  const UPGRADABLE_TREASURY = (
    await hre.ethers.getContract("TaskTreasuryUpgradable")
  ).address;

  await deploy("Automate", {
    from: deployer,
    proxy: {
      proxyContract: isZksync(hre.network.name) ? "EIP173Proxy" : undefined,
      owner: deployer,
    },
    args: [GELATO, UPGRADABLE_TREASURY],
    log: !isTesting(hre.network.name),
    gasLimit: 7_000_000,
  });
};

export default func;

func.skip = async (hre: HardhatRuntimeEnvironment) => {
  const shouldSkip = !isTesting(hre.network.name);
  return shouldSkip;
};

func.tags = ["Automate"];
func.dependencies = ["TaskTreasuryUpgradable"];
