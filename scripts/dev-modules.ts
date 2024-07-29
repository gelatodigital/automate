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
import { getContract } from "../src/utils";
import hre = require("hardhat");

export const setModules = async () => {
  const [owner] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();
  console.log("Owner: ", ownerAddress);

  const automateAddress = (await getContract<Automate>(hre, "Automate"))
    .address;
  const automate = <Automate>(
    await ethers.getContractAt("Automate", automateAddress)
  );

  const resolverModule = <ResolverModule>(
    await getContract(hre, "ResolverModule")
  );
  const proxyModule = <ProxyModule>await getContract(hre, "ProxyModule");
  const singleExecModule = <SingleExecModule>(
    await getContract(hre, "SingleExecModule")
  );
  const web3FunctionModule = <Web3FunctionModule>(
    await getContract(hre, "Web3FunctionModule")
  );
  const triggerModule = <TriggerModule>await getContract(hre, "TriggerModule");

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
