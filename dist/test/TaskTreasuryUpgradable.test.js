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
const EIP173Proxy_json_1 = require("hardhat-deploy/extendedArtifacts/EIP173Proxy.json");
const hre = require("hardhat");
const { ethers, deployments } = hre;
const dotenv = __importStar(require("dotenv"));
const config = dotenv.config();
const ALCHEMY_ID = (_a = config === null || config === void 0 ? void 0 : config.parsed) === null || _a === void 0 ? void 0 : _a.ALCHEMY_ID;
const GELATO = "0x3CACa7b48D0573D793d3b0279b5F0029180E83b6";
const OPS = "0xB3f5503f93d5Ef84b06993a1975B9D21B962892F";
const OLD_TASK_TREASURY = "0x66e2F69df68C8F56837142bE2E8C290EfE76DA9f";
const ETH = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
describe("TaskTreasuryUpgradable test", function () {
    this.timeout(0);
    let deployer;
    let treasuryOwner;
    let opsOwner;
    let user;
    let executor;
    let deployerAddress;
    let userAddress;
    let treasuryOwnerAddress;
    let opsOwnerAddress;
    let ops;
    let oldTreasury;
    let treasury;
    let counter;
    let execData;
    let execAddress;
    let resolverHash;
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            // testing on mainnet block 14068500, where pokeme and treasury is deployed
            yield setupFork();
            yield deployments.fixture();
            [deployer, user] = yield ethers.getSigners();
            deployerAddress = yield deployer.getAddress();
            userAddress = yield user.getAddress();
            oldTreasury = yield ethers.getContractAt("TaskTreasury", OLD_TASK_TREASURY);
            treasury = yield ethers.getContract("TaskTreasuryUpgradable");
            counter = yield ethers.getContract("Counter");
            const opsFactory = yield ethers.getContractFactory("Ops");
            ops = (yield opsFactory.deploy(GELATO, treasury.address));
            const opsProxy = yield ethers.getContractAt(EIP173Proxy_json_1.abi, OPS);
            chai_1.expect(yield ops.taskTreasury()).to.be.eql(treasury.address);
            // get accounts
            treasuryOwnerAddress = yield oldTreasury.owner();
            opsOwnerAddress = yield opsProxy.owner();
            yield hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [treasuryOwnerAddress],
            });
            yield hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [opsOwnerAddress],
            });
            yield hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [GELATO],
            });
            executor = yield ethers.getSigner(GELATO);
            treasuryOwner = yield ethers.getSigner(treasuryOwnerAddress);
            opsOwner = yield ethers.getSigner(opsOwnerAddress);
            // account set-up
            const value = ethers.utils.parseEther("10");
            yield deployer.sendTransaction({
                to: treasuryOwnerAddress,
                value,
            });
            yield oldTreasury
                .connect(user)
                .depositFunds(userAddress, ETH, value, { value });
            // upgrade opsProxy
            yield opsProxy.connect(opsOwner).upgradeTo(ops.address);
            // whitelist
            oldTreasury.connect(treasuryOwner).addWhitelistedService(treasury.address);
            treasury.connect(deployer).addWhitelistedService(ops.address);
            // create task
            const execSelector = counter.interface.getSighash("increaseCount");
            execAddress = counter.address;
            execData = counter.interface.encodeFunctionData("increaseCount", [1]);
            const resolverAddress = ethers.constants.AddressZero;
            const resolverData = ethers.constants.HashZero;
            resolverHash = yield ops.getResolverHash(resolverAddress, resolverData);
            yield ops
                .connect(user)
                .createTask(execAddress, execSelector, resolverAddress, resolverData);
        });
    });
    it("deposit by transfering ETH", () => __awaiter(this, void 0, void 0, function* () {
        const depositAmount = ethers.utils.parseEther("1");
        const oldBalanceBefore = yield oldTreasury.userTokenBalance(userAddress, ETH);
        yield user.sendTransaction({
            to: treasury.address,
            value: depositAmount,
        });
        const oldBalanceAfter = yield oldTreasury.userTokenBalance(userAddress, ETH);
        const newBalanceAfter = yield treasury.userTokenBalance(userAddress, ETH);
        chai_1.expect(oldBalanceAfter).to.be.eq(ethers.BigNumber.from("0"));
        chai_1.expect(newBalanceAfter).to.be.eql(oldBalanceBefore.add(depositAmount));
    }));
    it("deposit when no funds in old treasury", () => __awaiter(this, void 0, void 0, function* () {
        const balance = yield oldTreasury.userTokenBalance(userAddress, ETH);
        yield oldTreasury.connect(user).withdrawFunds(userAddress, ETH, balance);
        chai_1.expect(yield oldTreasury.userTokenBalance(userAddress, ETH)).to.be.eq(ethers.BigNumber.from("0"));
        const depositAmount = ethers.utils.parseEther("1");
        yield treasury
            .connect(user)
            .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });
        chai_1.expect(yield treasury.userTokenBalance(userAddress, ETH)).to.be.eql(depositAmount);
    }));
    it("exec when no funds in old treasury", () => __awaiter(this, void 0, void 0, function* () {
        const balance = yield oldTreasury.userTokenBalance(userAddress, ETH);
        yield oldTreasury.connect(user).withdrawFunds(userAddress, ETH, balance);
        chai_1.expect(yield oldTreasury.userTokenBalance(userAddress, ETH)).to.be.eq(ethers.BigNumber.from("0"));
        const depositAmount = ethers.utils.parseEther("1");
        yield treasury
            .connect(user)
            .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });
        const txFee = ethers.utils.parseEther("1");
        yield ops
            .connect(executor)
            .exec(txFee, ETH, userAddress, true, resolverHash, execAddress, execData);
        const newBalanceAfter = yield treasury.userTokenBalance(userAddress, ETH);
        chai_1.expect(newBalanceAfter).to.be.eql(depositAmount.sub(txFee));
        chai_1.expect(yield treasury.userTokenBalance(deployerAddress, ETH)).to.be.eql(txFee);
    }));
    it("deposit and migrate funds", () => __awaiter(this, void 0, void 0, function* () {
        const oldBalanceBefore = yield oldTreasury.userTokenBalance(userAddress, ETH);
        const depositAmount = ethers.utils.parseEther("0.1");
        yield treasury.connect(user).depositFunds(userAddress, ETH, depositAmount, {
            value: depositAmount,
        });
        const oldBalanceAfter = yield oldTreasury.userTokenBalance(userAddress, ETH);
        const newBalanceAfter = yield treasury.userTokenBalance(userAddress, ETH);
        chai_1.expect(newBalanceAfter).to.be.eql(oldBalanceBefore.add(depositAmount));
        chai_1.expect(oldBalanceAfter).to.be.eq(ethers.BigNumber.from("0"));
    }));
    it("exec and migrate funds", () => __awaiter(this, void 0, void 0, function* () {
        const oldBalanceBefore = yield oldTreasury.userTokenBalance(userAddress, ETH);
        const txFee = ethers.utils.parseEther("1");
        yield ops
            .connect(executor)
            .exec(txFee, ETH, userAddress, true, resolverHash, execAddress, execData);
        const newBalanceAfter = yield treasury.userTokenBalance(userAddress, ETH);
        const oldBalanceAfter = yield oldTreasury.userTokenBalance(userAddress, ETH);
        chai_1.expect(newBalanceAfter).to.be.eql(oldBalanceBefore.sub(txFee));
        chai_1.expect(oldBalanceAfter).to.be.eq(ethers.BigNumber.from("0"));
        chai_1.expect(yield treasury.userTokenBalance(deployerAddress, ETH)).to.be.eql(txFee);
    }));
});
const setupFork = () => __awaiter(void 0, void 0, void 0, function* () {
    yield hre.network.provider.request({
        method: "hardhat_reset",
        params: [
            {
                forking: {
                    jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
                    blockNumber: 14068500,
                },
            },
        ],
    });
});
