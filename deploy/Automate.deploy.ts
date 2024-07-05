import hre, { deployments, ethers, getNamedAccounts } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getAddresses } from "../src/addresses";
import { isFirstDeploy, isTesting, isZksync, sleep } from "../src/utils";
import { Automate, EIP173Proxy } from "../typechain";

const isHardhat = isTesting(hre.network.name);
const isDevEnv = hre.network.name.endsWith("Dev");
const isDynamicNetwork = hre.network.isDynamic;
const noDeterministicDeployment = hre.network.noDeterministicDeployment;

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (!isTesting(hre.network.name)) {
    console.log(
      `Deploying Automate to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(5000);
  }
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

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
      ? ethers.utils.formatBytes32String("Automate-dev")
      : ethers.utils.formatBytes32String("Automate-prod"),
    log: !isTesting(hre.network.name),
  });

  if (isFirst) {
    const proxy = (await ethers.getContract("Automate_Proxy")) as EIP173Proxy;
    const implementation = (await ethers.getContract(
      "Automate_Implementation"
    )) as Automate;

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
