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
const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
describe("PokeMeTwo Test", function () {
    let pokeMe;
    let counter;
    let counterResolver;
    let taskTreasury;
    let dai;
    let user;
    let userAddress;
    let user2;
    let user2Address;
    let executor;
    let executorAddress;
    let resolverData;
    let taskId;
    let taskHash;
    let selector;
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            [user, user2] = yield hardhat_1.ethers.getSigners();
            userAddress = yield user.getAddress();
            user2Address = yield user2.getAddress();
            const taskTreasuryFactory = yield hardhat_1.ethers.getContractFactory("TaskTreasury");
            const pokeMeFactory = yield hardhat_1.ethers.getContractFactory("PokeMe");
            const counterFactory = yield hardhat_1.ethers.getContractFactory("Counter");
            const counterResolverFactory = yield hardhat_1.ethers.getContractFactory("CounterResolver");
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
            taskId = yield pokeMe.getTaskId(userAddress, counter.address, selector, true);
            yield chai_1.expect(pokeMe
                .connect(user)
                .createTask(counter.address, selector, counterResolver.address, resolverData, true))
                .to.emit(pokeMe, "TaskCreated")
                .withArgs(userAddress, counter.address, selector, counterResolver.address, taskId, resolverData, true);
            taskHash = yield pokeMe.getTaskId(userAddress, counter.address, selector, true);
        });
    });
    it("sender already started task", () => __awaiter(this, void 0, void 0, function* () {
        yield chai_1.expect(pokeMe
            .connect(user)
            .createTask(counter.address, selector, counterResolver.address, resolverData, true)).to.be.revertedWith("PokeMe: createTask: Sender already started task");
    }));
    it("sender did not start task", () => __awaiter(this, void 0, void 0, function* () {
        yield pokeMe.connect(user).cancelTask(taskHash);
        yield chai_1.expect(pokeMe.connect(user).cancelTask(taskHash)).to.be.revertedWith("PokeMe: cancelTask: Sender did not start task yet");
    }));
    it("deposit and withdraw ETH", () => __awaiter(this, void 0, void 0, function* () {
        const depositAmount = hardhat_1.ethers.utils.parseEther("1");
        yield taskTreasury
            .connect(user)
            .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });
        chai_1.expect(yield taskTreasury.userTokenBalance(userAddress, ETH)).to.be.eq(hardhat_1.ethers.utils.parseEther("1"));
        yield chai_1.expect(taskTreasury
            .connect(user)
            .withdrawFunds(userAddress, ETH, hardhat_1.ethers.utils.parseEther("1")))
            .to.emit(taskTreasury, "FundsWithdrawn")
            .withArgs(userAddress, userAddress, ETH, depositAmount);
        chai_1.expect(yield taskTreasury.userTokenBalance(userAddress, ETH)).to.be.eq(hardhat_1.ethers.BigNumber.from("0"));
    }));
    it("deposit and withdraw DAI", () => __awaiter(this, void 0, void 0, function* () {
        const depositAmount = hardhat_1.ethers.utils.parseEther("1");
        const DAI_CHECKSUM = hardhat_1.ethers.utils.getAddress(DAI);
        yield helpers_1.getTokenFromFaucet(DAI, userAddress, depositAmount);
        yield dai.approve(taskTreasury.address, depositAmount);
        yield chai_1.expect(taskTreasury.connect(user).depositFunds(userAddress, DAI, depositAmount))
            .to.emit(taskTreasury, "FundsDeposited")
            .withArgs(userAddress, DAI_CHECKSUM, depositAmount);
        chai_1.expect(yield taskTreasury.userTokenBalance(userAddress, DAI)).to.be.eq(hardhat_1.ethers.utils.parseEther("1"));
        yield chai_1.expect(taskTreasury.connect(user).withdrawFunds(userAddress, DAI, depositAmount))
            .to.emit(taskTreasury, "FundsWithdrawn")
            .withArgs(userAddress, userAddress, DAI_CHECKSUM, depositAmount);
        chai_1.expect(yield taskTreasury.userTokenBalance(userAddress, DAI)).to.be.eq(hardhat_1.ethers.BigNumber.from("0"));
    }));
    it("user withdraw more ETH than balance", () => __awaiter(this, void 0, void 0, function* () {
        const depositAmount = hardhat_1.ethers.utils.parseEther("10");
        yield taskTreasury
            .connect(user2)
            .depositFunds(user2Address, ETH, depositAmount, { value: depositAmount });
        const balanceBefore = yield hardhat_1.ethers.provider.getBalance(pokeMe.address);
        yield taskTreasury
            .connect(user)
            .withdrawFunds(userAddress, ETH, hardhat_1.ethers.utils.parseEther("1"));
        const balanceAfter = yield hardhat_1.ethers.provider.getBalance(pokeMe.address);
        chai_1.expect(balanceAfter).to.be.eql(balanceBefore);
        chai_1.expect(yield taskTreasury.userTokenBalance(user2Address, ETH)).to.be.eql(depositAmount);
        chai_1.expect(Number(yield taskTreasury.userTokenBalance(userAddress, ETH))).to.be.eql(0);
    }));
    it("user withdraw more DAI than balance", () => __awaiter(this, void 0, void 0, function* () {
        const depositAmount = hardhat_1.ethers.utils.parseEther("10");
        yield helpers_1.getTokenFromFaucet(DAI, user2Address, depositAmount);
        yield dai.connect(user2).approve(taskTreasury.address, depositAmount);
        yield taskTreasury
            .connect(user2)
            .depositFunds(user2Address, DAI, depositAmount);
        const balanceBefore = yield dai.balanceOf(taskTreasury.address);
        yield taskTreasury
            .connect(user)
            .withdrawFunds(userAddress, DAI, hardhat_1.ethers.utils.parseEther("1"));
        const balanceAfter = yield dai.balanceOf(taskTreasury.address);
        chai_1.expect(balanceAfter).to.be.eql(balanceBefore);
        chai_1.expect(yield taskTreasury.userTokenBalance(user2Address, DAI)).to.be.eql(depositAmount);
        chai_1.expect(Number(yield taskTreasury.userTokenBalance(userAddress, DAI))).to.be.eql(0);
    }));
    it("no task found when exec", () => __awaiter(this, void 0, void 0, function* () {
        const THREE_MIN = 3 * 60;
        yield hardhat_1.network.provider.send("evm_increaseTime", [THREE_MIN]);
        yield hardhat_1.network.provider.send("evm_mine", []);
        yield pokeMe.connect(user).cancelTask(taskHash);
        const [, execData] = yield counterResolver.checker();
        yield chai_1.expect(pokeMe
            .connect(executor)
            .exec(hardhat_1.ethers.utils.parseEther("1"), DAI, userAddress, true, counter.address, execData)).to.be.revertedWith("PokeMe: exec: No task found");
    }));
    it("canExec should be true, caller does not have enough ETH", () => __awaiter(this, void 0, void 0, function* () {
        const THREE_MIN = 3 * 60;
        yield hardhat_1.network.provider.send("evm_increaseTime", [THREE_MIN]);
        yield hardhat_1.network.provider.send("evm_mine", []);
        const depositAmount = hardhat_1.ethers.utils.parseEther("0.5");
        yield taskTreasury
            .connect(user)
            .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });
        const [canExec, execData] = yield counterResolver.checker();
        chai_1.expect(canExec).to.be.eq(true);
        yield chai_1.expect(pokeMe
            .connect(executor)
            .exec(hardhat_1.ethers.utils.parseEther("1"), ETH, userAddress, true, counter.address, execData)).to.be.reverted;
    }));
    it("canExec should be true, caller does not have enough DAI", () => __awaiter(this, void 0, void 0, function* () {
        const THREE_MIN = 3 * 60;
        yield hardhat_1.network.provider.send("evm_increaseTime", [THREE_MIN]);
        yield hardhat_1.network.provider.send("evm_mine", []);
        const [canExec, execData] = yield counterResolver.checker();
        chai_1.expect(canExec).to.be.eq(true);
        const depositAmount = hardhat_1.ethers.utils.parseEther("0.5");
        yield helpers_1.getTokenFromFaucet(DAI, userAddress, depositAmount);
        yield dai.connect(user).approve(taskTreasury.address, depositAmount);
        yield taskTreasury
            .connect(user)
            .depositFunds(userAddress, DAI, depositAmount);
        yield chai_1.expect(pokeMe
            .connect(executor)
            .exec(hardhat_1.ethers.utils.parseEther("1"), DAI, userAddress, true, counter.address, execData)).to.be.revertedWith("reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)");
        chai_1.expect(yield taskTreasury.userTokenBalance(userAddress, DAI)).to.be.eql(depositAmount);
    }));
    it("should exec and pay with ETH", () => __awaiter(this, void 0, void 0, function* () {
        const [canExec, execData] = yield counterResolver.checker();
        chai_1.expect(canExec).to.be.eq(true);
        const THREE_MIN = 3 * 60;
        yield hardhat_1.network.provider.send("evm_increaseTime", [THREE_MIN]);
        yield hardhat_1.network.provider.send("evm_mine", []);
        chai_1.expect(yield counter.count()).to.be.eq(hardhat_1.ethers.BigNumber.from("0"));
        const depositAmount = hardhat_1.ethers.utils.parseEther("1");
        yield taskTreasury
            .connect(user)
            .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });
        chai_1.expect(yield taskTreasury.connect(user).userTokenBalance(userAddress, ETH)).to.be.eq(hardhat_1.ethers.utils.parseEther("1"));
        yield pokeMe
            .connect(executor)
            .exec(hardhat_1.ethers.utils.parseEther("1"), ETH, userAddress, true, counter.address, execData);
        chai_1.expect(yield counter.count()).to.be.eq(hardhat_1.ethers.BigNumber.from("100"));
        chai_1.expect(yield taskTreasury.connect(user).userTokenBalance(userAddress, ETH)).to.be.eq(hardhat_1.ethers.BigNumber.from("0"));
        // time not elapsed
        yield chai_1.expect(pokeMe
            .connect(executor)
            .exec(hardhat_1.ethers.utils.parseEther("1"), ETH, userAddress, true, counter.address, execData)).to.be.revertedWith("PokeMe: exec: Execution failed");
    }));
    it("should exec and pay with DAI", () => __awaiter(this, void 0, void 0, function* () {
        const [canExec, execData] = yield counterResolver.checker();
        chai_1.expect(canExec).to.be.eq(true);
        const THREE_MIN = 3 * 60;
        yield hardhat_1.network.provider.send("evm_increaseTime", [THREE_MIN]);
        yield hardhat_1.network.provider.send("evm_mine", []);
        const depositAmount = hardhat_1.ethers.utils.parseEther("2");
        yield helpers_1.getTokenFromFaucet(DAI, userAddress, depositAmount);
        yield dai.connect(user).approve(taskTreasury.address, depositAmount);
        yield taskTreasury
            .connect(user)
            .depositFunds(userAddress, DAI, depositAmount);
        chai_1.expect(yield taskTreasury.connect(user).userTokenBalance(userAddress, DAI)).to.be.eq(hardhat_1.ethers.utils.parseEther("2"));
        yield pokeMe
            .connect(executor)
            .exec(hardhat_1.ethers.utils.parseEther("1"), DAI, userAddress, true, counter.address, execData);
        chai_1.expect(yield counter.count()).to.be.eq(hardhat_1.ethers.BigNumber.from("100"));
        // time not elapsed
        yield chai_1.expect(pokeMe
            .connect(executor)
            .exec(hardhat_1.ethers.utils.parseEther("1"), DAI, userAddress, true, counter.address, execData)).to.be.revertedWith("PokeMe: exec: Execution failed");
    }));
    it("getTaskIdsByUser test", () => __awaiter(this, void 0, void 0, function* () {
        // fake task
        yield pokeMe
            .connect(user)
            .createTask(userAddress, selector, counterResolver.address, resolverData, true);
        const ids = yield pokeMe.getTaskIdsByUser(userAddress);
        chai_1.expect(ids.length).to.be.eql(2);
    }));
    it("getCreditTokensByUser test", () => __awaiter(this, void 0, void 0, function* () {
        const depositAmount = hardhat_1.ethers.utils.parseEther("1");
        yield helpers_1.getTokenFromFaucet(DAI, userAddress, depositAmount);
        yield dai.approve(taskTreasury.address, depositAmount);
        yield taskTreasury
            .connect(user)
            .depositFunds(userAddress, DAI, depositAmount);
        yield taskTreasury
            .connect(user)
            .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });
        chai_1.expect(yield taskTreasury.userTokenBalance(userAddress, ETH)).to.be.eql(depositAmount);
        chai_1.expect(yield taskTreasury.userTokenBalance(userAddress, DAI)).to.be.eql(depositAmount);
    }));
});
