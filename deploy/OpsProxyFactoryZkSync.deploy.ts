import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { utils } from "zksync-web3";
// import { bytecode } from "../artifacts-zk/contracts/vendor/proxy/EIP173/EIP173OpsProxy.sol/EIP173OpsProxy.json";
import hre, { ethers } from "hardhat";
import { getContract, isTesting, isZksync, sleep } from "../src/utils";
import { Automate, OpsProxy } from "../typechain";

const isHardhat = isTesting(hre.network.name);

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (!isTesting(hre.network.name)) {
    console.log(
      `Deploying OpsProxyFactoryZkSync to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(10000);
  }

  const bytecode = ethers.constants.HashZero;
  if (isZksync(hre.network.name)) {
    throw new Error(`Use bytecode from generated artifacts`);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const accounts = await hre.getNamedAccounts();
  const deployer = isHardhat
    ? accounts["hardhatDeployer"]
    : accounts["deployer"];

  const AUTOMATE = (await getContract<Automate>(hre, "Automate")).address;
  const OPSPROXY = (await getContract<OpsProxy>(hre, "OpsProxy")).address;

  const eip173OpsProxyByteCodeHash =
    "0x" + Buffer.from(utils.hashBytecode(bytecode)).toString("hex");

  await deploy("OpsProxyFactoryZkSync", {
    from: deployer,
    proxy: {
      proxyContract: isZksync(hre.network.name) ? "EIP173Proxy" : undefined,
      owner: deployer,
      execute: {
        init: {
          methodName: "initialize",
          args: [OPSPROXY],
        },
      },
    },
    args: [AUTOMATE, eip173OpsProxyByteCodeHash],
    log: !isTesting(hre.network.name),
    gasLimit: 3_000_000,
  });
};

export default func;

func.skip = async (hre: HardhatRuntimeEnvironment) => {
  const shouldSkip = !isTesting(hre.network.name);
  return shouldSkip;
};

func.tags = ["OpsProxyFactoryZkSync"];
