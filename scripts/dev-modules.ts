import { ethers } from "hardhat";
import { Module } from "../test/utils";
import {
  Automate,
  ProxyModule,
  ResolverModule,
  SingleExecModule,
  TriggerModule,
  Web3FunctionModule,
} from "../typechain";

export const setModules = async () => {
  const [owner] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();
  console.log("Owner: ", ownerAddress);

  const automateAddress = (await ethers.getContract("Automate")).address;
  const automate = <Automate>(
    await ethers.getContractAt("Automate", automateAddress)
  );

  const resolverModule = <ResolverModule>(
    await ethers.getContract("ResolverModule")
  );
  const proxyModule = <ProxyModule>await ethers.getContract("ProxyModule");
  const singleExecModule = <SingleExecModule>(
    await ethers.getContract("SingleExecModule")
  );
  const web3FunctionModule = <Web3FunctionModule>(
    await ethers.getContract("Web3FunctionModule")
  );
  const triggerModule = <TriggerModule>(
    await ethers.getContract("TriggerModule")
  );

  const modules = [
    Module.RESOLVER,
    Module.PROXY,
    Module.SINGLE_EXEC,
    Module.WEB3_FUNCTION,
    Module.TRIGGER,
  ];
  const moduleAddresses = [
    resolverModule.address,
    proxyModule.address,
    singleExecModule.address,
    web3FunctionModule.address,
    triggerModule.address,
  ];

  await automate.setModule(modules, moduleAddresses);
};

setModules();
