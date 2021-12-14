"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const helpers_1 = require("./helpers");
const hre = require("hardhat");
const { ethers, deployments } = hre;
const dotenv = __importStar(require("dotenv"));
const config = dotenv.config();
const ALCHEMY_ID = (_a = config === null || config === void 0 ? void 0 : config.parsed) === null || _a === void 0 ? void 0 : _a.ALCHEMY_ID;
const GELATO = "0x3CACa7b48D0573D793d3b0279b5F0029180E83b6";
const ORACLE_AGGREGATOR = "0x64f31D46C52bBDe223D863B11dAb9327aB1414E9";
const OLD_TASK_TREASURY = "0x66e2F69df68C8F56837142bE2E8C290EfE76DA9f";
const USER = "0xAabB54394E8dd61Dd70897E9c80be8de7C64A895";
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const ETH = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
describe("TaskTreasuryAccounting test", function () {
    this.timeout(0);
    let owner;
    let user;
    let executor;
    let userAddress;
    let ownerAddress;
    let pokeMe;
    let treasury;
    let counter;
    let counterResolver;
    let oracle;
    let dai;
    let resolverHash;
    let execData;
    let taskId;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            forkMakerDepositDaiBlock();
            yield deployments.fixture();
            [owner] = yield hre.ethers.getSigners();
            ownerAddress = yield owner.getAddress();
            yield hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [USER],
            });
            user = ethers.provider.getSigner(USER);
            userAddress = USER;
            yield hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [GELATO],
            });
            executor = yield ethers.provider.getSigner(GELATO);
            pokeMe = (yield ethers.getContract("PokeMe"));
            treasury = (yield ethers.getContract("TaskTreasuryAccounting"));
            counter = (yield ethers.getContract("Counter"));
            counterResolver = (yield ethers.getContract("CounterResolver"));
            oracle = (yield ethers.getContractAt("IOracleAggregator", ORACLE_AGGREGATOR));
            dai = (yield ethers.getContractAt("IERC20", DAI));
        });
    });
    it("DAI from old treasury should be top credit token", () => __awaiter(this, void 0, void 0, function* () {
        const [topCreditInNativeToken, topCreditToken, treasuryAddress] = yield treasury.getTopCreditToken(USER);
        const { returnAmount: daiInNativeToken } = yield oracle.getExpectedReturnAmount(ethers.utils.parseEther("1000"), DAI, ETH);
        chai_1.expect(daiInNativeToken).to.be.eq(topCreditInNativeToken);
        chai_1.expect(topCreditToken).to.be.eq(DAI);
        chai_1.expect(treasuryAddress).to.be.eq(OLD_TASK_TREASURY);
    }));
    it("DAI balance should increase", () => __awaiter(this, void 0, void 0, function* () {
        const depositAmount = ethers.utils.parseEther("2000");
        yield helpers_1.getTokenFromFaucet(DAI, userAddress, depositAmount);
        const daiBefore = yield dai.balanceOf(userAddress);
        yield dai.connect(user).approve(treasury.address, depositAmount);
        yield treasury.connect(user).depositFunds(userAddress, DAI, depositAmount);
        const daiAfter = yield dai.balanceOf(userAddress);
        chai_1.expect(yield treasury.userTokenBalance(userAddress, DAI)).to.be.eql(depositAmount);
        chai_1.expect(daiBefore.sub(daiAfter)).to.be.eql(depositAmount);
    }));
    it("DAI from new treasury should be top credit token", () => __awaiter(this, void 0, void 0, function* () {
        const [topCreditInNativeToken, topCreditToken, treasuryAddress] = yield treasury.getTopCreditToken(USER);
        const { returnAmount: daiInNativeToken } = yield oracle.getExpectedReturnAmount(ethers.utils.parseEther("2000"), DAI, ETH);
        chai_1.expect(topCreditToken).to.be.eql(DAI);
        chai_1.expect(treasuryAddress).to.be.eql(treasury.address);
        chai_1.expect(daiInNativeToken).to.be.eql(topCreditInNativeToken);
    }));
    it("DAI balance should decrease from successful execution", () => __awaiter(this, void 0, void 0, function* () {
        yield treasury.connect(owner).addWhitelistedService(pokeMe.address);
        const selector = yield pokeMe.getSelector("increaseCount(uint256)");
        const resolverData = counterResolver.interface.encodeFunctionData("checker");
        resolverHash = yield pokeMe.getResolverHash(counterResolver.address, resolverData);
        taskId = yield pokeMe.getTaskId(userAddress, counter.address, selector, true, ethers.constants.AddressZero, resolverHash);
        yield pokeMe
            .connect(user)
            .createTask(counter.address, selector, counterResolver.address, resolverData);
        [, execData] = yield counterResolver.checker();
        const userDaiBefore = yield treasury.userTokenBalance(userAddress, DAI);
        const ownerDaiBefore = yield treasury.userTokenBalance(ownerAddress, DAI);
        const fee = ethers.utils.parseEther("300");
        yield chai_1.expect(pokeMe
            .connect(executor)
            .exec(fee, DAI, userAddress, treasury.address, resolverHash, counter.address, execData))
            .to.emit(pokeMe, "ExecSuccess")
            .withArgs(fee, DAI, counter.address, execData, taskId, true);
        const userDaiAfter = yield treasury.userTokenBalance(userAddress, DAI);
        const ownerDaiAfter = yield treasury.userTokenBalance(ownerAddress, DAI);
        chai_1.expect(userDaiBefore.sub(userDaiAfter)).to.be.eql(fee);
        chai_1.expect(ownerDaiAfter.sub(ownerDaiBefore)).to.be.eql(fee);
    }));
    it("DAI balance should decrease from reverting execution", () => __awaiter(this, void 0, void 0, function* () {
        const userDaiBefore = yield treasury.userTokenBalance(userAddress, DAI);
        const ownerDaiBefore = yield treasury.userTokenBalance(ownerAddress, DAI);
        const fee = ethers.utils.parseEther("300");
        yield chai_1.expect(pokeMe
            .connect(executor)
            .exec(fee, DAI, userAddress, treasury.address, resolverHash, counter.address, execData))
            .to.emit(pokeMe, "ExecSuccess")
            .withArgs(fee, DAI, counter.address, execData, taskId, false);
        const userDaiAfter = yield treasury.userTokenBalance(userAddress, DAI);
        const ownerDaiAfter = yield treasury.userTokenBalance(ownerAddress, DAI);
        chai_1.expect(userDaiBefore.sub(userDaiAfter)).to.be.eql(fee);
        chai_1.expect(ownerDaiAfter.sub(ownerDaiBefore)).to.be.eql(fee);
    }));
    it("Owner should be able to withdraw DAI", () => __awaiter(this, void 0, void 0, function* () {
        const ownerDaiBefore = yield dai.balanceOf(ownerAddress);
        const daiBalance = yield treasury.userTokenBalance(ownerAddress, DAI);
        yield treasury.connect(owner).withdrawFunds(ownerAddress, DAI, daiBalance);
        const ownerDaiAfter = yield dai.balanceOf(ownerAddress);
        chai_1.expect(ownerDaiAfter).to.be.eql(ownerDaiBefore.add(daiBalance));
    }));
});
const forkMakerDepositDaiBlock = () => __awaiter(void 0, void 0, void 0, function* () {
    yield hre.network.provider.request({
        method: "hardhat_reset",
        params: [
            {
                forking: {
                    jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
                    blockNumber: 13716692,
                },
            },
        ],
    });
});
