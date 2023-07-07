import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { isTesting, isZksync, sleep } from "../hardhat/utils";
import { utils } from "zksync-web3";
import { bytecode } from "../artifacts-zk/contracts/vendor/proxy/EIP173/EIP173OpsProxy.sol/EIP173OpsProxy.json";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (!isTesting(hre.network.name)) {
    console.log(
      `Deploying OpsProxyFactoryZkSync to ${hre.network.name}. Hit ctrl + c to abort`
    );
    await sleep(10000);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();

  const AUTOMATE = (await hre.ethers.getContract("Automate")).address;
  const OPSPROXY = (await hre.ethers.getContract("OpsProxy")).address;

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
