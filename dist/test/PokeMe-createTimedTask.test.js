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
const MegaPoker_json_1 = __importDefault(require("./abis/MegaPoker.json"));
const gelatoAddress = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const MEGAPOKER = "0x18Bd1a35Caf9F192234C7ABd995FBDbA5bBa81ca";
const THREE_MINUTES = 3 * 60;
const FEETOKEN = hardhat_1.ethers.constants.AddressZero;
describe("PokeMe createTimedTask test", function () {
    this.timeout(0);
    let pokeMe;
    let taskTreasury;
    let megaPoker;
    let forwarder;
    let user;
    let userAddress;
    let executor;
    let executorAddress;
    let interval;
    let execAddress;
    let execSelector;
    let execData;
    let resolverAddress;
    let resolverData;
    let taskId;
    let resolverHash;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            [user] = yield hardhat_1.ethers.getSigners();
            userAddress = yield user.getAddress();
            const taskTreasuryFactory = yield hardhat_1.ethers.getContractFactory("TaskTreasury");
            const pokeMeFactory = yield hardhat_1.ethers.getContractFactory("PokeMe");
            const forwarderFactory = yield hardhat_1.ethers.getContractFactory("Forwarder");
            megaPoker = yield hardhat_1.ethers.getContractAt(MegaPoker_json_1.default, MEGAPOKER);
            taskTreasury = (yield taskTreasuryFactory.deploy(gelatoAddress));
            pokeMe = (yield pokeMeFactory.deploy(gelatoAddress, taskTreasury.address));
            forwarder = (yield forwarderFactory.deploy());
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
            execData = yield megaPoker.interface.encodeFunctionData("poke");
            interval = THREE_MINUTES;
            execAddress = MEGAPOKER;
            execSelector = yield pokeMe.getSelector("poke()");
            resolverAddress = forwarder.address;
            resolverData = yield forwarder.interface.encodeFunctionData("checker", [
                execData,
            ]);
            resolverHash = hardhat_1.ethers.utils.keccak256(new hardhat_1.ethers.utils.AbiCoder().encode(["address", "bytes"], [resolverAddress, resolverData]));
            taskId = yield pokeMe.getTaskId(userAddress, execAddress, execSelector, true, FEETOKEN, resolverHash);
            yield chai_1.expect(pokeMe
                .connect(user)
                .createTimedTask(interval, execAddress, execSelector, resolverAddress, resolverData, FEETOKEN, true))
                .to.emit(pokeMe, "TaskCreated")
                .withArgs(userAddress, execAddress, execSelector, resolverAddress, taskId, resolverData, true, FEETOKEN, resolverHash);
        });
    });
    it("get time", () => __awaiter(this, void 0, void 0, function* () {
        const blocknumber = yield hardhat_1.ethers.provider.getBlockNumber();
        const timestamp = (yield hardhat_1.ethers.provider.getBlock(blocknumber)).timestamp;
        const time = yield pokeMe.timedTask(taskId);
        console.log(Number(time.nextExec));
        console.log(Number(timestamp));
        if (Number(time.nextExec) >= Number(timestamp)) {
            console.log("Not time to exec");
        }
        else {
            console.log("TIme to exec");
        }
    }));
    it("Forwarder should return true, exec should fail", () => __awaiter(this, void 0, void 0, function* () {
        const [canExec, payload] = yield forwarder.checker(execData);
        chai_1.expect(payload).to.be.eql(execData);
        chai_1.expect(canExec).to.be.eql(true);
        yield chai_1.expect(pokeMe
            .connect(executor)
            .exec(hardhat_1.ethers.utils.parseEther("1"), ETH, userAddress, true, resolverHash, execAddress, execData)).to.be.revertedWith("PokeMe: exec: Too early");
    }));
    it("Forwarder should return true, exec should succeed", () => __awaiter(this, void 0, void 0, function* () {
        yield hardhat_1.network.provider.send("evm_increaseTime", [THREE_MINUTES]);
        yield hardhat_1.network.provider.send("evm_mine", []);
        yield chai_1.expect(pokeMe
            .connect(executor)
            .exec(hardhat_1.ethers.utils.parseEther("1"), ETH, userAddress, true, resolverHash, execAddress, execData))
            .to.emit(pokeMe, "ExecSuccess")
            .withArgs(hardhat_1.ethers.utils.parseEther("1"), ETH, execAddress, execData, taskId);
    }));
});
