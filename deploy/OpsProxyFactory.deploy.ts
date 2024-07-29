import hre, { deployments, ethers, getNamedAccounts } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  getContract,
  isFirstDeploy,
  isTesting,
  isZksync,
  sleep,
} from "../src/utils";
import { Automate, EIP173Proxy, OpsProxy, OpsProxyFactory } from "../typechain";

const isHardhat = isTesting(hre.network.name);
const isDevEnv = hre.network.name.endsWith("Dev");
const isDynamicNetwork = hre.network.isDynamic;
// eslint-disable-next-line @typescript-eslint/naming-convention
const noDeterministicDeployment = hre.network.noDeterministicDeployment;

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (!isTesting(hre.network.name)) {
    console.log(
      `Deploying OpsProxyFactory to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(5000);
  }
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const isFirst = await isFirstDeploy(hre, "OpsProxyFactory");

  const AUTOMATE = (await getContract<Automate>(hre, "Automate")).address;

  await deploy("OpsProxyFactory", {
    from: deployer,
    proxy: {
      proxyContract: isZksync(hre.network.name) ? "EIP173Proxy" : undefined,
      owner: deployer,
      proxyArgs: [ethers.constants.AddressZero, deployer, "0x"],
    },
    args: [AUTOMATE],
    deterministicDeployment: noDeterministicDeployment
      ? false
      : isDevEnv
      ? ethers.utils.formatBytes32String("OpsProxyFactory-dev")
      : ethers.utils.formatBytes32String("OpsProxyFactory-prod"),
    log: !isTesting(hre.network.name),
  });

  if (isFirst || isHardhat) {
    const proxy = await getContract<EIP173Proxy>(hre, "OpsProxyFactory_Proxy");
    const implementation = await getContract<OpsProxyFactory>(
      hre,
      "OpsProxyFactory_Implementation"
    );

    const OPSPROXY = (await getContract<OpsProxy>(hre, "OpsProxy")).address;
    const initializeData = implementation.interface.encodeFunctionData(
      "initialize",
      [OPSPROXY]
    );

    console.log(`Setting implementation to ${implementation.address}`);
    const tx = await proxy.upgradeToAndCall(
      implementation.address,
      initializeData
    );
    const receipt = await tx.wait();
    console.log(`Implementation set in tx: ${receipt.transactionHash}`);
  }
};

export default func;

func.skip = async () => {
  if (isDynamicNetwork) {
    return false;
  } else {
    return !isHardhat;
  }
};

func.tags = ["OpsProxyFactory"];
