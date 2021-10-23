/* eslint-disable @typescript-eslint/no-explicit-any */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { PokeMe, TaskTreasury, Counter } from "../typechain";
import { createWeb3ApiClient, Web3ApiClient } from "@web3api/client-js";
import { graphNodePlugin } from "@web3api/graph-node-plugin-js";
import { ethereumPlugin } from "@web3api/ethereum-plugin-js";
import { loggerPlugin } from "@web3api/logger-plugin-js";
import { httpPlugin } from "@web3api/http-plugin-js";
import { dateTimePlugin } from "date-time-plugin";
import { EthereumProvider } from "@web3api/client-js/build/pluginConfigs/Ethereum";
import env from "dotenv";

const gelatoAddress = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const FEETOKEN = ethers.constants.AddressZero;
const IPFSCID = "QmVcNCtV7aeci92nqeyHNxgU8TjN2gyRAr2DXcwA8ntcg7";
const config = env.config();
let JSONRPCURL: string;
if (config.parsed)
  JSONRPCURL = `https://eth-mainnet.alchemyapi.io/v2/${config.parsed.ALCHEMY_ID}`;

describe("PokeMe createPolywrapResolverTask test", function () {
  this.timeout(0);

  let pokeMe: PokeMe;
  let taskTreasury: TaskTreasury;
  let counter: Counter;

  let polywrapClient: Web3ApiClient;

  let user: SignerWithAddress;
  let userAddress: string;

  let executor: any;
  let executorAddress: string;

  let execAddress: string;
  let execSelector: string;
  let resolverAddress: string;
  let resolverData: string;
  let taskId: string;
  let resolverHash: string;

  before(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: JSONRPCURL,
            blockNumber: 13474500,
          },
        },
      ],
    });

    [user] = await ethers.getSigners();
    userAddress = await user.getAddress();

    polywrapClient = await getWeb3ApiClient();

    const taskTreasuryFactory = await ethers.getContractFactory("TaskTreasury");
    const pokeMeFactory = await ethers.getContractFactory("PokeMe");

    counter = <Counter>(
      await ethers.getContractAt(
        "Counter",
        "0x15A4D35e067213278c5a996F6050F37e7de6DF2f"
      )
    );
    taskTreasury = <TaskTreasury>(
      await taskTreasuryFactory.deploy(gelatoAddress)
    );
    pokeMe = <PokeMe>(
      await pokeMeFactory.deploy(gelatoAddress, taskTreasury.address)
    );

    executorAddress = gelatoAddress;

    await taskTreasury.addWhitelistedService(pokeMe.address);

    const depositAmount = ethers.utils.parseEther("1");
    await taskTreasury
      .connect(user)
      .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [executorAddress],
    });

    executor = await ethers.provider.getSigner(executorAddress);

    execAddress = counter.address;
    execSelector = await pokeMe.getSelector("increaseCount(uint256)");
    resolverAddress = await pokeMe.stringToAddress(IPFSCID);
    resolverData = ethers.constants.HashZero;

    resolverHash = ethers.utils.keccak256(
      new ethers.utils.AbiCoder().encode(
        ["address", "bytes"],
        [resolverAddress, resolverData]
      )
    );

    taskId = await pokeMe.getTaskId(
      userAddress,
      execAddress,
      execSelector,
      true,
      FEETOKEN,
      resolverHash
    );

    await expect(
      pokeMe
        .connect(user)
        .createPolywrapResolverTask(
          execAddress,
          execSelector,
          IPFSCID,
          resolverData,
          FEETOKEN,
          true
        )
    )
      .to.emit(pokeMe, "TaskCreated")
      .withArgs(
        userAddress,
        execAddress,
        execSelector,
        resolverAddress,
        taskId,
        resolverData,
        true,
        FEETOKEN,
        resolverHash
      );
  });

  it("should query polywrap and execute", async () => {
    const topics = pokeMe.filters.PolywrapCid().topics;
    const filter = {
      address: pokeMe.address.toLowerCase(),
      topics,
    };
    const logs = await ethers.provider.getLogs(filter);
    const event = pokeMe.interface.parseLog(logs[0]);

    const ipfsCid = event.args.ipfsCid;
    expect(event.args.taskId).to.be.eql(taskId);
    expect(ipfsCid).to.be.eql(IPFSCID);
    const uri = "w3://ipfs/" + ipfsCid;

    const result = await polywrapClient.query({
      uri: uri,
      query: `
            query checker{
              checker
            }`,
    });

    let canExec;
    let execData;
    if (result.data) {
      const canExecResult = result?.data.checker as unknown as {
        canExec: boolean;
        execPayload: string;
      };

      canExec = canExecResult.canExec;
      execData = canExecResult.execPayload;
    } else {
      throw new Error("No query result from polywrap");
    }

    const preCount = Number(await counter.count());

    if (canExec)
      await pokeMe
        .connect(executor)
        .exec(
          ethers.utils.parseEther("0.1"),
          ETH,
          userAddress,
          true,
          resolverHash,
          execAddress,
          execData
        );

    const postCount = Number(await counter.count());

    expect(postCount).to.be.eql(preCount + 100);
  });
});

const getWeb3ApiClient = async (): Promise<Web3ApiClient> => {
  const prov: EthereumProvider = new ethers.providers.JsonRpcProvider(
    JSONRPCURL
  );

  const client = await createWeb3ApiClient(
    {},
    {
      plugins: [
        {
          uri: "ens/datetime.eth",
          plugin: dateTimePlugin({}),
        },
        {
          uri: "w3://ens/ethereum.web3api.eth",
          plugin: ethereumPlugin({
            networks: { mainnet: { provider: prov } },
            defaultNetwork: "mainnet",
          }),
        },
        {
          uri: "w3://ens/graph-node.web3api.eth",
          plugin: graphNodePlugin({ provider: "https://api.thegraph.com" }),
        },
        {
          uri: "w3://ens/js-logger.web3api.eth",
          plugin: loggerPlugin(),
        },
        {
          uri: "w3://ens/http.web3api.eth",
          plugin: httpPlugin(),
        },
      ],
    }
  );

  return client;
};
