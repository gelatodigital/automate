import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import hre, { deployments, getNamedAccounts } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getContract, isTesting, sleep } from "../src/utils";
import { Automate } from "../typechain";

const isHardhat = isTesting(hre.network.name);
const isDevEnv = hre.network.name.endsWith("Dev");
const isDynamicNetwork = hre.network.isDynamic;
// eslint-disable-next-line @typescript-eslint/naming-convention
const noDeterministicDeployment = hre.network.noDeterministicDeployment;

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (!isTesting(hre.network.name)) {
    console.log(
      `Deploying OpsProxy to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(5000);
  }
  const { deploy } = deployments;
  const accounts = await getNamedAccounts();
  const deployer = isHardhat
    ? accounts["hardhatDeployer"]
    : accounts["deployer"];

  const AUTOMATE = (await getContract<Automate>(hre, "Automate")).address;

  await deploy("OpsProxy", {
    from: deployer,
    args: [AUTOMATE],
    deterministicDeployment: noDeterministicDeployment
      ? false
      : isDevEnv
      ? keccak256(toUtf8Bytes("OpsProxy-dev"))
      : keccak256(toUtf8Bytes("OpsProxy-prod")),

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

func.tags = ["OpsProxy"];
