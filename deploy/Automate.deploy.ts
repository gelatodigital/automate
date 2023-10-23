import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getGelatoAddress } from "../hardhat/config/addresses";
import { isTesting, isZksync, sleep } from "../hardhat/utils";

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

  await deploy("Automate", {
    from: deployer,
    proxy: {
      proxyContract: isZksync(hre.network.name) ? "EIP173Proxy" : undefined,
      owner: deployer,
    },
    args: [GELATO],
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
