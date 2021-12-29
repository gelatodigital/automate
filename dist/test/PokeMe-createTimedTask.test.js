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
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hre = require("hardhat");
const { ethers, deployments } = hre;
const gelatoAddress = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const THREE_MINUTES = 3 * 60;
const FEETOKEN = ethers.constants.AddressZero;
describe("PokeMe createTimedTask test", function () {
    this.timeout(0);
    let pokeMe;
    let taskTreasury;
    let forwarder;
    let counter;
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
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            yield deployments.fixture();
            [user] = yield ethers.getSigners();
            userAddress = yield user.getAddress();
            pokeMe = (yield ethers.getContract("PokeMe"));
            taskTreasury = (yield ethers.getContract("TaskTreasury"));
            counter = (yield ethers.getContract("CounterTimedTask"));
            forwarder = (yield ethers.getContract("Forwarder"));
            executorAddress = gelatoAddress;
            yield taskTreasury.addWhitelistedService(pokeMe.address);
            const depositAmount = ethers.utils.parseEther("1");
            yield taskTreasury
                .connect(user)
                .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });
            yield hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [executorAddress],
            });
            executor = yield ethers.provider.getSigner(executorAddress);
            execData = yield counter.interface.encodeFunctionData("increaseCount", [
                100,
            ]);
            interval = THREE_MINUTES;
            execAddress = counter.address;
            execSelector = yield pokeMe.getSelector("increaseCount(uint256)");
            resolverAddress = forwarder.address;
            resolverData = yield forwarder.interface.encodeFunctionData("checker", [
                execData,
            ]);
            resolverHash = ethers.utils.keccak256(new ethers.utils.AbiCoder().encode(["address", "bytes"], [resolverAddress, resolverData]));
            taskId = yield pokeMe.getTaskId(userAddress, execAddress, execSelector, true, FEETOKEN, resolverHash);
            const currentTimestamp = (_b = (yield ((_a = user.provider) === null || _a === void 0 ? void 0 : _a.getBlock("latest")))) === null || _b === void 0 ? void 0 : _b.timestamp;
            yield chai_1.expect(pokeMe
                .connect(user)
                .createTimedTask(currentTimestamp + interval, interval, execAddress, execSelector, resolverAddress, resolverData, FEETOKEN, true))
                .to.emit(pokeMe, "TaskCreated")
                .withArgs(userAddress, execAddress, execSelector, resolverAddress, taskId, resolverData, true, FEETOKEN, resolverHash);
        });
    });
    it("Exec should fail when time not elapsed", () => __awaiter(this, void 0, void 0, function* () {
        const [canExec, payload] = yield forwarder.checker(execData);
        chai_1.expect(payload).to.be.eql(execData);
        chai_1.expect(canExec).to.be.eql(true);
        yield chai_1.expect(pokeMe
            .connect(executor)
            .exec(ethers.utils.parseEther("0.1"), ETH, userAddress, taskTreasury.address, resolverHash, execAddress, execData)).to.be.revertedWith("PokeMe: exec: Too early");
    }));
    it("Exec should succeed when time elapse", () => __awaiter(this, void 0, void 0, function* () {
        yield hre.network.provider.send("evm_increaseTime", [THREE_MINUTES]);
        yield hre.network.provider.send("evm_mine", []);
        const nextExecBefore = (yield pokeMe.timedTask(taskId)).nextExec;
        yield counter.setExecutable(true);
        yield chai_1.expect(pokeMe
            .connect(executor)
            .exec(ethers.utils.parseEther("0.1"), ETH, userAddress, taskTreasury.address, resolverHash, execAddress, execData))
            .to.emit(pokeMe, "CallSuccess")
            .withArgs(taskId, true);
        const nextExecAfter = (yield pokeMe.timedTask(taskId)).nextExec;
        chai_1.expect(yield taskTreasury.userTokenBalance(userAddress, ETH)).to.be.eql(ethers.utils.parseEther("0.9"));
        chai_1.expect(Number(yield counter.count())).to.be.eql(100);
        chai_1.expect(nextExecAfter).to.be.gt(nextExecBefore);
    }));
    it("Exec should succeed even if txn fails", () => __awaiter(this, void 0, void 0, function* () {
        yield hre.network.provider.send("evm_increaseTime", [THREE_MINUTES]);
        yield hre.network.provider.send("evm_mine", []);
        const nextExecBefore = (yield pokeMe.timedTask(taskId)).nextExec;
        yield counter.setExecutable(false);
        yield chai_1.expect(pokeMe
            .connect(executor)
            .exec(ethers.utils.parseEther("0.1"), ETH, userAddress, taskTreasury.address, resolverHash, execAddress, execData))
            .to.emit(pokeMe, "CallSuccess")
            .withArgs(taskId, false);
        const nextExecAfter = (yield pokeMe.timedTask(taskId)).nextExec;
        chai_1.expect(Number(yield counter.count())).to.be.eql(100);
        chai_1.expect(yield taskTreasury.userTokenBalance(userAddress, ETH)).to.be.eql(ethers.utils.parseEther("0.8"));
        chai_1.expect(nextExecAfter).to.be.gt(nextExecBefore);
    }));
    it("should skip one interval", () => __awaiter(this, void 0, void 0, function* () {
        yield hre.network.provider.send("evm_increaseTime", [2 * THREE_MINUTES]);
        yield hre.network.provider.send("evm_mine", []);
        const nextExecBefore = (yield pokeMe.timedTask(taskId)).nextExec;
        yield counter.setExecutable(true);
        yield chai_1.expect(pokeMe
            .connect(executor)
            .exec(ethers.utils.parseEther("0.1"), ETH, userAddress, taskTreasury.address, resolverHash, execAddress, execData))
            .to.emit(pokeMe, "CallSuccess")
            .withArgs(taskId, true);
        const nextExecAfter = (yield pokeMe.timedTask(taskId)).nextExec;
        chai_1.expect(Number(yield counter.count())).to.be.eql(200);
        chai_1.expect(yield taskTreasury.userTokenBalance(userAddress, ETH)).to.be.eql(ethers.utils.parseEther("0.7"));
        chai_1.expect(Number(nextExecAfter.sub(nextExecBefore))).to.be.eql(2 * THREE_MINUTES);
    }));
    it("Should account for drift", () => __awaiter(this, void 0, void 0, function* () {
        yield hre.network.provider.send("evm_increaseTime", [50 * THREE_MINUTES]);
        yield hre.network.provider.send("evm_mine", []);
        yield pokeMe
            .connect(executor)
            .exec(ethers.utils.parseEther("0.1"), ETH, userAddress, taskTreasury.address, resolverHash, execAddress, execData);
        yield chai_1.expect(pokeMe
            .connect(executor)
            .exec(ethers.utils.parseEther("0.1"), ETH, userAddress, taskTreasury.address, resolverHash, execAddress, execData)).to.be.revertedWith("PokeMe: exec: Too early");
        chai_1.expect(Number(yield counter.count())).to.be.eql(300);
        chai_1.expect(yield taskTreasury.userTokenBalance(userAddress, ETH)).to.be.eql(ethers.utils.parseEther("0.6"));
    }));
});
