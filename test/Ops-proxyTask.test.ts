import { expect } from "chai";
import { Signer } from "@ethersproject/abstract-signer";
import { abi as EIP173PROXY_ABI } from "hardhat-deploy/extendedArtifacts/EIP173Proxy.json";
import {
  Counter,
  Ops,
  OpsProxy,
  OpsProxyFactory,
  ProxyHandler,
  TaskTreasuryUpgradable,
} from "../typechain";

import hre = require("hardhat");
const { ethers, deployments } = hre;
import * as dotenv from "dotenv";
const config = dotenv.config();
const ALCHEMY_ID = config?.parsed?.ALCHEMY_ID;

const GELATO = "0x3CACa7b48D0573D793d3b0279b5F0029180E83b6";
const OPS_173PROXY = "0xB3f5503f93d5Ef84b06993a1975B9D21B962892F";
const UPGRADABLE_TREASURY = "0x2807B4aE232b624023f87d0e237A3B1bf200Fd99";
const ETH = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const ZERO_ADDRESS = ethers.constants.AddressZero;

describe("Ops proxy task test", function () {
  this.timeout(0);

  let deployer: Signer;
  let executor: Signer;
  let opsOwner: Signer;
  let user: Signer;
  let user2: Signer;

  let opsOwnerAddress: string;
  let userAddress: string;
  let user2Address: string;

  let ops: Ops;
  let opsProxy: OpsProxy;
  let opsProxyFactory: OpsProxyFactory;
  let proxyHandler: ProxyHandler;
  let treasury: TaskTreasuryUpgradable;
  let counter: Counter;

  const txFee = ethers.utils.parseEther("0.5");

  before(async function () {
    // testing on mainnet block 14607294 (18th Apr)
    await setupFork();
    await deployments.fixture();
    [deployer, user, user2] = await ethers.getSigners();
    userAddress = await user.getAddress();
    user2Address = await user2.getAddress();

    treasury = await ethers.getContractAt(
      "TaskTreasuryUpgradable",
      UPGRADABLE_TREASURY
    );
    counter = await ethers.getContract("Counter");
    opsProxyFactory = await ethers.getContract("OpsProxyFactory");

    const opsFactory = await ethers.getContractFactory("Ops");

    const opsImplementation = await opsFactory.deploy(
      GELATO,
      treasury.address,
      opsProxyFactory.address
    );
    const ops173Proxy = await ethers.getContractAt(
      EIP173PROXY_ABI,
      OPS_173PROXY
    );

    // get accounts
    opsOwnerAddress = await ops173Proxy.owner();

    await deployer.sendTransaction({
      value: ethers.utils.parseEther("3"),
      to: opsOwnerAddress,
    });

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [opsOwnerAddress],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [GELATO],
    });

    executor = await ethers.getSigner(GELATO);
    opsOwner = await ethers.getSigner(opsOwnerAddress);

    // upgrade opsProxy
    await ops173Proxy.connect(opsOwner).upgradeTo(opsImplementation.address);
    ops = await ethers.getContractAt("Ops", OPS_173PROXY);
  });

  it("deploy ops proxy", async () => {
    await opsProxyFactory.connect(user).deploy();

    const proxyAddress = await opsProxyFactory.getProxyOf(userAddress);
    opsProxy = await ethers.getContractAt("OpsProxy", proxyAddress);

    expect(await opsProxy.ops()).to.be.eql(ops.address);
    expect(await opsProxy.owner()).to.be.eql(userAddress);
    expect(await opsProxyFactory.isProxy(proxyAddress)).to.be.true;

    // whitelist proxy on counter
    await counter.connect(deployer).setWhitelist(opsProxy.address, true);
    expect(await counter.whitelisted(opsProxy.address)).to.be.true;
    // deploy proxyHandler
    const proxyHandlerFactory = await ethers.getContractFactory("ProxyHandler");
    proxyHandler = <ProxyHandler>(
      await proxyHandlerFactory.deploy(counter.address)
    );
  });

  it("add and remove admins", async () => {
    expect(await opsProxy.admins(user2Address)).to.be.false;
    await opsProxy.connect(user).setAdmin(user2Address, true);
    expect(await opsProxy.admins(user2Address)).to.be.true;
    await opsProxy.connect(user).setAdmin(user2Address, false);
    expect(await opsProxy.admins(user2Address)).to.be.false;
  });

  it("deposit funds", async () => {
    const depositAmount = ethers.utils.parseEther("8");
    const depositFundsData = treasury.interface.encodeFunctionData(
      "depositFunds",
      [opsProxy.address, ETH, depositAmount]
    );

    await opsProxy.connect(user).setAdmin(user2Address, true);
    await opsProxy
      .connect(user2)
      .executeCall(treasury.address, depositFundsData, depositAmount, {
        value: depositAmount,
      });

    const balance = await treasury.userTokenBalance(opsProxy.address, ETH);
    expect(balance).to.be.eql(depositAmount);
  });

  it("withdraw funds", async () => {
    const withdrawAmount = ethers.utils.parseEther("2");
    const balanceBefore = await treasury.userTokenBalance(
      opsProxy.address,
      ETH
    );

    const withdrawFundsData = treasury.interface.encodeFunctionData(
      "withdrawFunds",
      [opsProxy.address, ETH, withdrawAmount]
    );
    await opsProxy
      .connect(user)
      .executeCall(treasury.address, withdrawFundsData, 0);

    const balanceAfter = await treasury.userTokenBalance(opsProxy.address, ETH);

    expect(balanceAfter).to.be.eql(balanceBefore.sub(withdrawAmount));
  });

  it("owner/admin cannot create task for proxy", async () => {
    await expect(createTaskForProxy(user, "executeCall")).to.be.revertedWith(
      "Ops: _createTask: Only ops proxy"
    );
  });

  it("owner/admin can create task with proxy", async () => {
    // task creator will be proxy, exec address is proxy address
    const task = await createTaskWithProxy(user, "executeCall");
    expect(await ops.taskCreator(task.taskId)).to.be.eql(opsProxy.address);

    await executeAndCompareCount(task);
  });

  it("non owner/admin cannot create task with proxy", async () => {
    await expect(
      createTaskWithProxy(deployer, "executeCall")
    ).to.be.revertedWith("OpsProxy: Not authorised");
  });

  it("delegate call", async () => {
    await fastForwardTime();
    const task = await createTaskWithProxy(user, "executeDelegateCall");
    expect(await ops.taskCreator(task.taskId)).to.be.eql(opsProxy.address);

    await executeAndCompareCount(task);
  });

  //---------------------------------Helper functions---------------------------
  const executeAndCompareCount = async (task: TaskDetails) => {
    await fastForwardTime();

    const countBefore = await counter.count();

    await ops
      .connect(executor)
      .exec(
        txFee,
        ETH,
        task.taskCreator,
        task.isUseTaskTreasury,
        true,
        task.resolverHash,
        task.execAddress,
        task.execData
      );

    const countAfter = await counter.count();
    expect(countAfter).to.be.gt(countBefore);
  };

  const createTaskForProxy = async (
    signer: Signer,
    callType: "executeCall" | "executeDelegateCall"
  ): Promise<TaskDetails> => {
    const task = await getTaskDetails(signer, false, callType);

    await expect(
      ops
        .connect(signer)
        .createTask(
          task.execAddress,
          task.execSelector,
          task.resolverAddress,
          task.resolverData
        )
    )
      .to.emit(ops, "TaskCreated")
      .withArgs(
        task.taskCreator,
        task.execAddress,
        task.execSelector,
        task.resolverAddress,
        task.taskId,
        task.resolverData,
        task.isUseTaskTreasury,
        task.feeToken,
        task.resolverHash
      );

    return task;
  };

  const createTaskWithProxy = async (
    signer: Signer,
    callType: "executeCall" | "executeDelegateCall"
  ): Promise<TaskDetails> => {
    const task = await getTaskDetails(signer, true, callType);

    const createTaskData = ops.interface.encodeFunctionData("createTask", [
      task.execAddress,
      task.execSelector,
      task.resolverAddress,
      task.resolverData,
    ]);

    await expect(
      opsProxy.connect(signer).executeCall(ops.address, createTaskData, 0)
    )
      .to.emit(ops, "TaskCreated")
      .withArgs(
        task.taskCreator,
        task.execAddress,
        task.execSelector,
        task.resolverAddress,
        task.taskId,
        task.resolverData,
        task.isUseTaskTreasury,
        task.feeToken,
        task.resolverHash
      );

    return task;
  };

  const getTaskDetails = async (
    signer: Signer,
    isWithProxy: boolean,
    callType: "executeCall" | "executeDelegateCall"
  ): Promise<TaskDetails> => {
    const taskCreator = isWithProxy
      ? opsProxy.address
      : await signer.getAddress();

    const execAddress = opsProxy.address;
    const execSelector = opsProxy.interface.getSighash(callType);
    const increaseCountData = counter.interface.encodeFunctionData(
      "increaseCount",
      [5]
    );

    const execData =
      callType == "executeCall"
        ? opsProxy.interface.encodeFunctionData("executeCall", [
            counter.address,
            increaseCountData,
            0,
          ])
        : opsProxy.interface.encodeFunctionData("executeDelegateCall", [
            proxyHandler.address,
            increaseCountData,
          ]);

    const resolverAddress = ZERO_ADDRESS;
    const resolverData = "0x00";
    const resolverHash = await ops.getResolverHash(
      resolverAddress,
      resolverData
    );
    const isUseTaskTreasury = true;
    const feeToken = ZERO_ADDRESS;
    const taskId = await ops.getTaskId(
      taskCreator,
      execAddress,
      execSelector,
      isUseTaskTreasury,
      feeToken,
      resolverHash
    );

    return {
      taskCreator,
      execAddress,
      execSelector,
      execData,
      resolverAddress,
      resolverData,
      resolverHash,
      feeToken,
      isUseTaskTreasury,
      taskId,
    };
  };
});

const setupFork = async () => {
  await hre.network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
          blockNumber: 14607294,
        },
      },
    ],
  });
};

const fastForwardTime = async () => {
  await ethers.provider.send("evm_increaseTime", [300]);
  await ethers.provider.send("evm_mine", []);
};

type TaskDetails = {
  taskCreator: string;
  execAddress: string;
  execSelector: string;
  execData: string;
  resolverAddress: string;
  resolverData: string;
  resolverHash: string;
  feeToken: string;
  isUseTaskTreasury: boolean;
  taskId: string;
};
