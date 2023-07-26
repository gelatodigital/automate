import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import * as hre from "hardhat";
const { ethers } = hre;
import { OpsProxyFactoryZkSync } from "../typechain";

const describeConditionally =
  hre.network.name === "zksyncLocal" ? describe : describe.skip;

// NOTE: Running a local zksync node is required for this test suite - https://era.zksync.io/docs/tools/hardhat/testing.html#installing-the-testing-environment
describeConditionally("OpsProxyFactoryZkSync test", function () {
  let opsProxyFactoryZkSync: OpsProxyFactoryZkSync;

  let user: Signer;
  let userAddress: string;

  before(async function () {
    if (hre.network.name !== "zksyncLocal") throw new Error("Run this ");
    const res = await hre.deployments.fixture();

    [user] = await ethers.getSigners();
    userAddress = await user.getAddress();

    opsProxyFactoryZkSync = await ethers.getContractAt(
      res["OpsProxyFactoryZkSync"].abi,
      res["OpsProxyFactoryZkSync"].address,
      user
    );
  });

  it("should determine and deploy opsProxy correctly", async function () {
    let proxyAddress: string | undefined;
    let isDeployed: boolean | undefined;

    [proxyAddress, isDeployed] = await opsProxyFactoryZkSync.getProxyOf(
      userAddress
    );

    const determinedAddress = await opsProxyFactoryZkSync.determineProxyAddress(
      userAddress
    );

    expect(proxyAddress).to.be.eql(determinedAddress);
    expect(isDeployed).to.be.false;

    await expect(opsProxyFactoryZkSync.deploy())
      .to.emit(opsProxyFactoryZkSync, "DeployProxy")
      .withArgs(userAddress, userAddress, determinedAddress);

    [proxyAddress, isDeployed] = await opsProxyFactoryZkSync.getProxyOf(
      userAddress
    );

    expect(proxyAddress).to.be.eql(determinedAddress);
    expect(isDeployed).to.be.true;

    const ownerOfProxy = await opsProxyFactoryZkSync.ownerOf(proxyAddress);

    expect(ownerOfProxy).to.be.eql(userAddress);
  });
});
