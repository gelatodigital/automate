"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
const client_js_1 = require("@web3api/client-js");
const graph_node_plugin_js_1 = require("@web3api/graph-node-plugin-js");
const ethereum_plugin_js_1 = require("@web3api/ethereum-plugin-js");
const logger_plugin_js_1 = require("@web3api/logger-plugin-js");
const http_plugin_js_1 = require("@web3api/http-plugin-js");
const date_time_plugin_1 = require("date-time-plugin");
const dotenv_1 = __importDefault(require("dotenv"));
const gelatoAddress = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const FEETOKEN = hardhat_1.ethers.constants.AddressZero;
const IPFSCID = "QmVcNCtV7aeci92nqeyHNxgU8TjN2gyRAr2DXcwA8ntcg7";
const config = dotenv_1.default.config();
let JSONRPCURL;
if (config.parsed)
    JSONRPCURL = `https://eth-mainnet.alchemyapi.io/v2/${config.parsed.ALCHEMY_ID}`;
describe("PokeMe createPolywrapResolverTask test", function () {
    this.timeout(0);
    let pokeMe;
    let taskTreasury;
    let counter;
    let polywrapClient;
    let user;
    let userAddress;
    let executor;
    let executorAddress;
    let execAddress;
    let execSelector;
    let resolverAddress;
    let resolverData;
    let taskId;
    let resolverHash;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield hardhat_1.network.provider.request({
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
            [user] = yield hardhat_1.ethers.getSigners();
            userAddress = yield user.getAddress();
            polywrapClient = yield getWeb3ApiClient();
            const taskTreasuryFactory = yield hardhat_1.ethers.getContractFactory("TaskTreasury");
            const pokeMeFactory = yield hardhat_1.ethers.getContractFactory("PokeMe");
            counter = (yield hardhat_1.ethers.getContractAt("Counter", "0x15A4D35e067213278c5a996F6050F37e7de6DF2f"));
            taskTreasury = (yield taskTreasuryFactory.deploy(gelatoAddress));
            pokeMe = (yield pokeMeFactory.deploy(gelatoAddress, taskTreasury.address));
            executorAddress = gelatoAddress;
            yield taskTreasury.addWhitelistedService(pokeMe.address);
            const depositAmount = hardhat_1.ethers.utils.parseEther("1");
            yield taskTreasury
                .connect(user)
                .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });
            yield hardhat_1.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [executorAddress],
            });
            executor = yield hardhat_1.ethers.provider.getSigner(executorAddress);
            execAddress = counter.address;
            execSelector = yield pokeMe.getSelector("increaseCount(uint256)");
            resolverAddress = yield pokeMe.stringToAddress(IPFSCID);
            resolverData = hardhat_1.ethers.constants.HashZero;
            resolverHash = hardhat_1.ethers.utils.keccak256(new hardhat_1.ethers.utils.AbiCoder().encode(["address", "bytes"], [resolverAddress, resolverData]));
            taskId = yield pokeMe.getTaskId(userAddress, execAddress, execSelector, true, FEETOKEN, resolverHash);
            yield chai_1.expect(pokeMe
                .connect(user)
                .createPolywrapResolverTask(execAddress, execSelector, IPFSCID, resolverData, FEETOKEN, true))
                .to.emit(pokeMe, "TaskCreated")
                .withArgs(userAddress, execAddress, execSelector, resolverAddress, taskId, resolverData, true, FEETOKEN, resolverHash);
        });
    });
    it("should query polywrap and execute", () => __awaiter(this, void 0, void 0, function* () {
        const topics = pokeMe.filters.PolywrapCid().topics;
        const filter = {
            address: pokeMe.address.toLowerCase(),
            topics,
        };
        const logs = yield hardhat_1.ethers.provider.getLogs(filter);
        const event = pokeMe.interface.parseLog(logs[0]);
        const ipfsCid = event.args.ipfsCid;
        chai_1.expect(event.args.taskId).to.be.eql(taskId);
        chai_1.expect(ipfsCid).to.be.eql(IPFSCID);
        const uri = "w3://ipfs/" + ipfsCid;
        const result = yield polywrapClient.query({
            uri: uri,
            query: `
            query checker{
              checker
            }`,
        });
        let canExec;
        let execData;
        if (result.data) {
            const canExecResult = result === null || result === void 0 ? void 0 : result.data.checker;
            canExec = canExecResult.canExec;
            execData = canExecResult.execPayload;
        }
        else {
            throw new Error("No query result from polywrap");
        }
        const preCount = Number(yield counter.count());
        if (canExec)
            yield pokeMe
                .connect(executor)
                .exec(hardhat_1.ethers.utils.parseEther("0.1"), ETH, userAddress, true, resolverHash, execAddress, execData);
        const postCount = Number(yield counter.count());
        chai_1.expect(postCount).to.be.eql(preCount + 100);
    }));
});
const getWeb3ApiClient = () => __awaiter(void 0, void 0, void 0, function* () {
    const prov = new hardhat_1.ethers.providers.JsonRpcProvider(JSONRPCURL);
    const client = yield client_js_1.createWeb3ApiClient({}, {
        plugins: [
            {
                uri: "ens/datetime.eth",
                plugin: date_time_plugin_1.dateTimePlugin({}),
            },
            {
                uri: "w3://ens/ethereum.web3api.eth",
                plugin: ethereum_plugin_js_1.ethereumPlugin({
                    networks: { mainnet: { provider: prov } },
                    defaultNetwork: "mainnet",
                }),
            },
            {
                uri: "w3://ens/graph-node.web3api.eth",
                plugin: graph_node_plugin_js_1.graphNodePlugin({ provider: "https://api.thegraph.com" }),
            },
            {
                uri: "w3://ens/js-logger.web3api.eth",
                plugin: logger_plugin_js_1.loggerPlugin(),
            },
            {
                uri: "w3://ens/http.web3api.eth",
                plugin: http_plugin_js_1.httpPlugin(),
            },
        ],
    });
    return client;
});
