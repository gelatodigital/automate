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
const hardhat_1 = require("hardhat");
const helpers_1 = require("./helpers");
const gelatoAddress = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
describe("PokeMeV3 Test", function () {
    let pokeMe;
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
            [user] = yield hardhat_1.ethers.getSigners();
            userAddress = yield user.getAddress();
            const taskTreasuryFactory = yield hardhat_1.ethers.getContractFactory("TaskTreasury");
            const pokeMeFactory = yield hardhat_1.ethers.getContractFactory("PokeMe");
            const counterFactory = yield hardhat_1.ethers.getContractFactory("CounterWithoutTreasury");
            const counterResolverFactory = yield hardhat_1.ethers.getContractFactory("CounterResolverWithoutTreasury");
            dai = (yield hardhat_1.ethers.getContractAt("IERC20", DAI));
            taskTreasury = (yield taskTreasuryFactory.deploy(gelatoAddress));
            pokeMe = (yield pokeMeFactory.deploy(gelatoAddress, taskTreasury.address));
            counter = (yield counterFactory.deploy(pokeMe.address));
            counterResolver = (yield counterResolverFactory.deploy(counter.address));
            executorAddress = gelatoAddress;
            yield taskTreasury.addWhitelistedService(pokeMe.address);
            yield hardhat_1.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [executorAddress],
            });
            executor = yield hardhat_1.ethers.provider.getSigner(executorAddress);
            resolverData = yield counterResolver.interface.encodeFunctionData("checker");
            selector = yield pokeMe.getSelector("increaseCount(uint256)");
            resolverHashETH = yield pokeMe.getResolverHash(counterResolver.address, resolverData);
            resolverHashDAI = yield pokeMe.getResolverHash(counterResolver.address, resolverData);
            taskHashETH = yield pokeMe.getTaskId(userAddress, counter.address, selector, false, ETH, resolverHashETH);
            taskHashDAI = yield pokeMe.getTaskId(userAddress, counter.address, selector, false, DAI, resolverHashDAI);
            yield chai_1.expect(pokeMe
                .connect(user)
                .createTaskNoPrepayment(counter.address, selector, counterResolver.address, resolverData, ETH))
                .to.emit(pokeMe, "TaskCreated")
                .withArgs(userAddress, counter.address, selector, counterResolver.address, taskHashETH, resolverData, false, ETH, resolverHashETH);
            yield chai_1.expect(pokeMe
                .connect(user)
                .createTaskNoPrepayment(counter.address, selector, counterResolver.address, resolverData, DAI))
                .to.emit(pokeMe, "TaskCreated")
                .withArgs(userAddress, counter.address, selector, counterResolver.address, taskHashDAI, resolverData, false, DAI, resolverHashDAI);
        });
    });
    it("canExec should be true, counter does not have enough ETH", () => __awaiter(this, void 0, void 0, function* () {
        const THREE_MIN = 3 * 60;
        yield hardhat_1.network.provider.send("evm_increaseTime", [THREE_MIN]);
        yield hardhat_1.network.provider.send("evm_mine", []);
        const depositAmount = hardhat_1.ethers.utils.parseEther("0.5");
        yield user.sendTransaction({
            to: counter.address,
            value: depositAmount,
        });
        chai_1.expect(yield hardhat_1.ethers.provider.getBalance(counter.address)).to.be.eq(depositAmount);
        const [canExec, execData] = yield counterResolver.checker();
        chai_1.expect(canExec).to.be.eq(true);
        yield chai_1.expect(pokeMe
            .connect(executor)
            .exec(hardhat_1.ethers.utils.parseEther("1"), ETH, userAddress, false, resolverHashETH, counter.address, execData)).to.be.reverted;
    }));
    it("canExec should be true, counter does not have enough DAI", () => __awaiter(this, void 0, void 0, function* () {
        const THREE_MIN = 3 * 60;
        yield hardhat_1.network.provider.send("evm_increaseTime", [THREE_MIN]);
        yield hardhat_1.network.provider.send("evm_mine", []);
        const depositAmount = hardhat_1.ethers.utils.parseEther("0.5");
        yield helpers_1.getTokenFromFaucet(DAI, counter.address, depositAmount);
        chai_1.expect(yield dai.balanceOf(counter.address)).to.be.eq(depositAmount);
        const [canExec, execData] = yield counterResolver.checker();
        chai_1.expect(canExec).to.be.eq(true);
        yield chai_1.expect(pokeMe
            .connect(executor)
            .exec(hardhat_1.ethers.utils.parseEther("1"), DAI, userAddress, false, resolverHashDAI, counter.address, execData)).to.be.reverted;
    }));
    it("canExec should be true, counter have enough ETH", () => __awaiter(this, void 0, void 0, function* () {
        const THREE_MIN = 3 * 60;
        yield hardhat_1.network.provider.send("evm_increaseTime", [THREE_MIN]);
        yield hardhat_1.network.provider.send("evm_mine", []);
        const depositAmount = hardhat_1.ethers.utils.parseEther("5");
        yield user.sendTransaction({
            to: counter.address,
            value: depositAmount,
        });
        chai_1.expect(yield hardhat_1.ethers.provider.getBalance(counter.address)).to.be.eq(depositAmount);
        const gelatoBalanceBefore = yield hardhat_1.ethers.provider.getBalance(gelatoAddress);
        const [canExec, execData] = yield counterResolver.checker();
        chai_1.expect(canExec).to.be.eq(true);
        yield pokeMe
            .connect(executor)
            .exec(hardhat_1.ethers.utils.parseEther("1"), ETH, userAddress, false, resolverHashETH, counter.address, execData);
        const gelatoBalanceAfter = yield hardhat_1.ethers.provider.getBalance(gelatoAddress);
        chai_1.expect(gelatoBalanceAfter).to.be.gt(gelatoBalanceBefore);
        chai_1.expect(yield counter.count()).to.be.eq(hardhat_1.ethers.BigNumber.from("100"));
    }));
    it("canExec should be true, counter does not have enough DAI", () => __awaiter(this, void 0, void 0, function* () {
        const THREE_MIN = 3 * 60;
        yield hardhat_1.network.provider.send("evm_increaseTime", [THREE_MIN]);
        yield hardhat_1.network.provider.send("evm_mine", []);
        const depositAmount = hardhat_1.ethers.utils.parseEther("1");
        yield helpers_1.getTokenFromFaucet(DAI, counter.address, depositAmount);
        chai_1.expect(yield dai.balanceOf(counter.address)).to.be.eq(depositAmount);
        const gelatoDaiBefore = yield dai.balanceOf(gelatoAddress);
        const [canExec, execData] = yield counterResolver.checker();
        chai_1.expect(canExec).to.be.eq(true);
        yield pokeMe
            .connect(executor)
            .exec(hardhat_1.ethers.utils.parseEther("1"), DAI, userAddress, false, resolverHashDAI, counter.address, execData);
        const gelatoDaiAfter = yield dai.balanceOf(gelatoAddress);
        chai_1.expect(gelatoDaiAfter).to.be.gt(gelatoDaiBefore);
        chai_1.expect(yield counter.count()).to.be.eq(hardhat_1.ethers.BigNumber.from("100"));
    }));
});
