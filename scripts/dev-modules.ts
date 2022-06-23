import { ethers } from "hardhat";
import { Module } from "../test/utils";
import {
  Ops,
  ProxyModule,
  ResolverModule,
  SingleExecModule,
  TimeModule,
} from "../typechain";

const main = async () => {
  const [owner] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();
  console.log("Owner: ", ownerAddress);

  const ops = <Ops>await ethers.getContract("Ops");

  const resolverModule = <ResolverModule>(
    await ethers.getContract("ResolverModule")
  );
  const timeModule = <TimeModule>await ethers.getContract("TimeModule");
  const proxyModule = <ProxyModule>await ethers.getContract("ProxyModule");
  const singleExecModule = <SingleExecModule>(
    await ethers.getContract("SingleExecModule")
  );

  const modules = [
    Module.RESOLVER,
    Module.TIME,
    Module.PROXY,
    Module.SINGLE_EXEC,
  ];
  const moduleAddresses = [
    resolverModule.address,
    timeModule.address,
    proxyModule.address,
    singleExecModule.address,
  ];

  await ops.setModule(modules, moduleAddresses);
};

main();
