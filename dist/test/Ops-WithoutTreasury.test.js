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
const helpers_1 = require("./helpers");
const hre = require("hardhat");
const { ethers, deployments } = hre;
const gelatoAddress = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
describe("Ops without treasury test", function () {
    let ops;
    let counter;
    let counterResolver;
    let taskTreasury;
    let dai;
    let user;
    let userAddress;
    let executor;
    let executorAddress;
    let resolverData;
    let taskHashETH;
    let taskHashDAI;
    let selector;
    let resolverHashETH;
    let resolverHashDAI;
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield deployments.fixture();
            [user] = yield ethers.getSigners();
            userAddress = yield user.getAddress();
            ops = (yield ethers.getContract("Ops"));
            taskTreasury = (yield ethers.getContract("TaskTreasury"));
            counter = (yield ethers.getContract("CounterWithoutTreasury"));
            counterResolver = (yield ethers.getContract("CounterResolverWithoutTreasury"));
            dai = (yield ethers.getContractAt("IERC20", DAI));
            executorAddress = gelatoAddress;
            yield taskTreasury.addWhitelistedService(ops.address);
            yield hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [executorAddress],
            });
            executor = yield ethers.provider.getSigner(executorAddress);
            resolverData = yield counterResolver.interface.encodeFunctionData("checker");
            selector = yield ops.getSelector("increaseCount(uint256)");
            resolverHashETH = yield ops.getResolverHash(counterResolver.address, resolverData);
            resolverHashDAI = yield ops.getResolverHash(counterResolver.address, resolverData);
            taskHashETH = yield ops.getTaskId(userAddress, counter.address, selector, false, ETH, resolverHashETH);
            taskHashDAI = yield ops.getTaskId(userAddress, counter.address, selector, false, DAI, resolverHashDAI);
            yield chai_1.expect(ops
                .connect(user)
                .createTaskNoPrepayment(counter.address, selector, counterResolver.address, resolverData, ETH))
                .to.emit(ops, "TaskCreated")
                .withArgs(userAddress, counter.address, selector, counterResolver.address, taskHashETH, resolverData, false, ETH, resolverHashETH);
            yield chai_1.expect(ops
                .connect(user)
                .createTaskNoPrepayment(counter.address, selector, counterResolver.address, resolverData, DAI))
                .to.emit(ops, "TaskCreated")
                .withArgs(userAddress, counter.address, selector, counterResolver.address, taskHashDAI, resolverData, false, DAI, resolverHashDAI);
        });
    });
    it("canExec should be true, counter does not have enough ETH", () => __awaiter(this, void 0, void 0, function* () {
        const THREE_MIN = 3 * 60;
        yield hre.network.provider.send("evm_increaseTime", [THREE_MIN]);
        yield hre.network.provider.send("evm_mine", []);
        const depositAmount = ethers.utils.parseEther("0.5");
        yield user.sendTransaction({
            to: counter.address,
            value: depositAmount,
        });
        chai_1.expect(yield ethers.provider.getBalance(counter.address)).to.be.eq(depositAmount);
        const [canExec, execData] = yield counterResolver.checker();
        chai_1.expect(canExec).to.be.eq(true);
        // simulation should have failed
        yield chai_1.expect(ops
            .connect(executor)
            .exec(ethers.utils.parseEther("1"), ETH, userAddress, false, false, resolverHashETH, counter.address, execData))
            .to.emit(ops, "ExecSuccess")
            .withArgs(ethers.utils.parseEther("1"), ETH, counter.address, execData, taskHashETH, false);
    }));
    it("canExec should be true, counter does not have enough DAI", () => __awaiter(this, void 0, void 0, function* () {
        const THREE_MIN = 3 * 60;
        yield hre.network.provider.send("evm_increaseTime", [THREE_MIN]);
        yield hre.network.provider.send("evm_mine", []);
        const depositAmount = ethers.utils.parseEther("0.5");
        yield helpers_1.getTokenFromFaucet(DAI, counter.address, depositAmount);
        chai_1.expect(yield dai.balanceOf(counter.address)).to.be.eq(depositAmount);
        const [canExec, execData] = yield counterResolver.checker();
        chai_1.expect(canExec).to.be.eq(true);
        // simulation should have failed
        yield chai_1.expect(ops
            .connect(executor)
            .exec(ethers.utils.parseEther("1"), DAI, userAddress, false, false, resolverHashDAI, counter.address, execData))
            .to.emit(ops, "ExecSuccess")
            .withArgs(ethers.utils.parseEther("1"), DAI, counter.address, execData, taskHashDAI, false);
    }));
    it("canExec should be true, counter have enough ETH", () => __awaiter(this, void 0, void 0, function* () {
        const THREE_MIN = 3 * 60;
        yield hre.network.provider.send("evm_increaseTime", [THREE_MIN]);
        yield hre.network.provider.send("evm_mine", []);
        const depositAmount = ethers.utils.parseEther("5");
        yield user.sendTransaction({
            to: counter.address,
            value: depositAmount,
        });
        chai_1.expect(yield ethers.provider.getBalance(counter.address)).to.be.eq(depositAmount);
        const gelatoBalanceBefore = yield ethers.provider.getBalance(gelatoAddress);
        const [canExec, execData] = yield counterResolver.checker();
        chai_1.expect(canExec).to.be.eq(true);
        yield ops
            .connect(executor)
            .exec(ethers.utils.parseEther("1"), ETH, userAddress, false, false, resolverHashETH, counter.address, execData);
        const gelatoBalanceAfter = yield ethers.provider.getBalance(gelatoAddress);
        chai_1.expect(gelatoBalanceAfter).to.be.gt(gelatoBalanceBefore);
        chai_1.expect(yield counter.count()).to.be.eq(ethers.BigNumber.from("100"));
    }));
    it("canExec should be true, counter does not have enough DAI", () => __awaiter(this, void 0, void 0, function* () {
        const THREE_MIN = 3 * 60;
        yield hre.network.provider.send("evm_increaseTime", [THREE_MIN]);
        yield hre.network.provider.send("evm_mine", []);
        const depositAmount = ethers.utils.parseEther("1");
        yield helpers_1.getTokenFromFaucet(DAI, counter.address, depositAmount);
        chai_1.expect(yield dai.balanceOf(counter.address)).to.be.eq(depositAmount);
        const gelatoDaiBefore = yield dai.balanceOf(gelatoAddress);
        const [canExec, execData] = yield counterResolver.checker();
        chai_1.expect(canExec).to.be.eq(true);
        yield ops
            .connect(executor)
            .exec(ethers.utils.parseEther("1"), DAI, userAddress, false, false, resolverHashDAI, counter.address, execData);
        const gelatoDaiAfter = yield dai.balanceOf(gelatoAddress);
        chai_1.expect(gelatoDaiAfter).to.be.gt(gelatoDaiBefore);
        chai_1.expect(yield counter.count()).to.be.eq(ethers.BigNumber.from("100"));
    }));
});
