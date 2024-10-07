import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import hre, { deployments, ethers, getNamedAccounts } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getAddresses } from "../src/addresses";
import {
  getContract,
  isFirstDeploy,
  isTesting,
  isZksync,
  sleep,
} from "../src/utils";
import { Automate, EIP173Proxy } from "../typechain";

const isHardhat = isTesting(hre.network.name);
const isDevEnv = hre.network.name.endsWith("Dev");
const isDynamicNetwork = hre.network.isDynamic;
// eslint-disable-next-line @typescript-eslint/naming-convention
const noDeterministicDeployment = hre.network.noDeterministicDeployment;

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (!isTesting(hre.network.name)) {
    console.log(
      `Deploying Automate to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(5000);
  }
  const { deploy } = deployments;
  const accounts = await getNamedAccounts();
  const deployer = isHardhat
    ? accounts["hardhatDeployer"]
    : accounts["deployer"];

  const { GELATO } = getAddresses(hre.network.name, isDynamicNetwork);

  const isFirst = await isFirstDeploy(hre, "Automate");

  await deploy("Automate", {
    from: deployer,
    proxy: {
      proxyContract: isZksync(hre.network.name) ? "EIP173Proxy" : undefined,
      owner: deployer,
      proxyArgs: [ethers.constants.AddressZero, deployer, "0x"],
    },
    args: [GELATO],
    deterministicDeployment: noDeterministicDeployment
      ? false
      : isDevEnv
      ? keccak256(toUtf8Bytes("Automate-dev"))
      : keccak256(toUtf8Bytes("Automate-prod")),
    log: !isTesting(hre.network.name),
  });

  if (isFirst || isHardhat) {
    const proxy = await getContract<EIP173Proxy>(hre, "Automate_Proxy");
    const implementation = await getContract<Automate>(
      hre,
      "Automate_Implementation"
    );

    console.log(`Setting implementation to ${implementation.address}`);
    const tx = await proxy.upgradeTo(implementation.address);
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

func.tags = ["Automate"];
