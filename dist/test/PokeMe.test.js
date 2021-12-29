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
const execFacetAbi = [
    "function exec(address _service,bytes calldata _data,address _creditToken) external",
    "function addExecutors(address[] calldata _executors) external",
];
const ownerAddress = "0x163407FDA1a93941358c1bfda39a868599553b6D";
const diamondAddress = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
describe("PokeMe test", function () {
    let pokeMe;
    let counter;
    let counterResolver;
    let taskTreasury;
    let dai;
    let diamond;
    let user;
    let userAddress;
    let user2;
    let user2Address;
    let owner;
    let diamondSigner;
    let resolverData;
    let taskHash;
    let selector;
    let resolverHash;
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield deployments.fixture();
            [user, user2] = yield hre.ethers.getSigners();
            userAddress = yield user.getAddress();
            user2Address = yield user2.getAddress();
            pokeMe = (yield ethers.getContract("PokeMe"));
            taskTreasury = (yield ethers.getContract("TaskTreasury"));
            counter = (yield ethers.getContract("Counter"));
            counterResolver = (yield ethers.getContract("CounterResolver"));
            dai = (yield ethers.getContractAt("IERC20", DAI));
            diamond = yield ethers.getContractAt(execFacetAbi, diamondAddress);
            yield taskTreasury.addWhitelistedService(pokeMe.address);
            yield hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [ownerAddress],
            });
            yield hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [diamondAddress],
            });
            owner = yield ethers.provider.getSigner(ownerAddress);
            diamondSigner = yield ethers.provider.getSigner(diamondAddress);
            resolverData = counterResolver.interface.encodeFunctionData("checker");
            selector = yield pokeMe.getSelector("increaseCount(uint256)");
            resolverHash = ethers.utils.keccak256(new ethers.utils.AbiCoder().encode(["address", "bytes"], [counterResolver.address, resolverData]));
            taskHash = yield pokeMe.getTaskId(userAddress, counter.address, selector, true, ethers.constants.AddressZero, resolverHash);
            yield chai_1.expect(pokeMe
                .connect(user)
                .createTask(counter.address, selector, counterResolver.address, resolverData))
                .to.emit(pokeMe, "TaskCreated")
                .withArgs(userAddress, counter.address, selector, counterResolver.address, taskHash, resolverData, true, ethers.constants.AddressZero, resolverHash);
        });
    });
    it("sender already started task", () => __awaiter(this, void 0, void 0, function* () {
        yield chai_1.expect(pokeMe
            .connect(user)
            .createTask(counter.address, selector, counterResolver.address, resolverData)).to.be.revertedWith("PokeMe: createTask: Sender already started task");
    }));
    it("sender did not start task", () => __awaiter(this, void 0, void 0, function* () {
        yield pokeMe.connect(user).cancelTask(taskHash);
        yield chai_1.expect(pokeMe.connect(user).cancelTask(taskHash)).to.be.revertedWith("PokeMe: cancelTask: Sender did not start task yet");
    }));
    it("deposit and withdraw ETH", () => __awaiter(this, void 0, void 0, function* () {
        const depositAmount = ethers.utils.parseEther("1");
        yield taskTreasury
            .connect(user)
            .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });
        chai_1.expect(yield taskTreasury.userTokenBalance(userAddress, ETH)).to.be.eq(ethers.utils.parseEther("1"));
        yield chai_1.expect(taskTreasury
            .connect(user)
            .withdrawFunds(userAddress, ETH, ethers.utils.parseEther("1")))
            .to.emit(taskTreasury, "FundsWithdrawn")
            .withArgs(userAddress, userAddress, ETH, depositAmount);
        chai_1.expect(yield taskTreasury.userTokenBalance(userAddress, ETH)).to.be.eq(ethers.BigNumber.from("0"));
    }));
    it("deposit and withdraw DAI", () => __awaiter(this, void 0, void 0, function* () {
        const depositAmount = ethers.utils.parseEther("1");
        const DAI_CHECKSUM = ethers.utils.getAddress(DAI);
        yield helpers_1.getTokenFromFaucet(DAI, userAddress, depositAmount);
        yield dai.approve(taskTreasury.address, depositAmount);
        yield chai_1.expect(taskTreasury.connect(user).depositFunds(userAddress, DAI, depositAmount))
            .to.emit(taskTreasury, "FundsDeposited")
            .withArgs(userAddress, DAI_CHECKSUM, depositAmount);
        chai_1.expect(yield taskTreasury.userTokenBalance(userAddress, DAI)).to.be.eq(ethers.utils.parseEther("1"));
        yield chai_1.expect(taskTreasury.connect(user).withdrawFunds(userAddress, DAI, depositAmount))
            .to.emit(taskTreasury, "FundsWithdrawn")
            .withArgs(userAddress, userAddress, DAI_CHECKSUM, depositAmount);
        chai_1.expect(yield taskTreasury.userTokenBalance(userAddress, DAI)).to.be.eq(ethers.BigNumber.from("0"));
    }));
    it("user withdraw more ETH than balance", () => __awaiter(this, void 0, void 0, function* () {
        const depositAmount = ethers.utils.parseEther("10");
        yield taskTreasury
            .connect(user2)
            .depositFunds(user2Address, ETH, depositAmount, { value: depositAmount });
        const balanceBefore = yield ethers.provider.getBalance(pokeMe.address);
        yield taskTreasury
            .connect(user)
            .withdrawFunds(userAddress, ETH, ethers.utils.parseEther("1"));
        const balanceAfter = yield ethers.provider.getBalance(pokeMe.address);
        chai_1.expect(balanceAfter).to.be.eql(balanceBefore);
        chai_1.expect(yield taskTreasury.userTokenBalance(user2Address, ETH)).to.be.eql(depositAmount);
        chai_1.expect(Number(yield taskTreasury.userTokenBalance(userAddress, ETH))).to.be.eql(0);
    }));
    it("user withdraw more DAI than balance", () => __awaiter(this, void 0, void 0, function* () {
        const depositAmount = ethers.utils.parseEther("10");
        yield helpers_1.getTokenFromFaucet(DAI, user2Address, depositAmount);
        yield dai.connect(user2).approve(taskTreasury.address, depositAmount);
        yield taskTreasury
            .connect(user2)
            .depositFunds(user2Address, DAI, depositAmount);
        const balanceBefore = yield dai.balanceOf(taskTreasury.address);
        yield taskTreasury
            .connect(user)
            .withdrawFunds(userAddress, DAI, ethers.utils.parseEther("1"));
        const balanceAfter = yield dai.balanceOf(taskTreasury.address);
        chai_1.expect(balanceAfter).to.be.eql(balanceBefore);
        chai_1.expect(yield taskTreasury.userTokenBalance(user2Address, DAI)).to.be.eql(depositAmount);
        chai_1.expect(Number(yield taskTreasury.userTokenBalance(userAddress, DAI))).to.be.eql(0);
    }));
    it("no task found when exec", () => __awaiter(this, void 0, void 0, function* () {
        const THREE_MIN = 3 * 60;
        yield hre.network.provider.send("evm_increaseTime", [THREE_MIN]);
        yield hre.network.provider.send("evm_mine", []);
        yield pokeMe.connect(user).cancelTask(taskHash);
        const [, execData] = yield counterResolver.checker();
        yield chai_1.expect(pokeMe
            .connect(diamondSigner)
            .exec(ethers.utils.parseEther("1"), DAI, userAddress, true, resolverHash, counter.address, execData)).to.be.revertedWith("PokeMe: exec: No task found");
    }));
    it("canExec should be true, caller does not have enough ETH", () => __awaiter(this, void 0, void 0, function* () {
        const THREE_MIN = 3 * 60;
        yield hre.network.provider.send("evm_increaseTime", [THREE_MIN]);
        yield hre.network.provider.send("evm_mine", []);
        const depositAmount = ethers.utils.parseEther("0.5");
        yield taskTreasury
            .connect(user)
            .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });
        const [canExec, execData] = yield counterResolver.checker();
        chai_1.expect(canExec).to.be.eq(true);
        yield chai_1.expect(pokeMe
            .connect(diamondSigner)
            .exec(ethers.utils.parseEther("1"), ETH, userAddress, true, resolverHash, counter.address, execData)).to.be.reverted;
    }));
    it("canExec should be true, caller does not have enough DAI", () => __awaiter(this, void 0, void 0, function* () {
        const THREE_MIN = 3 * 60;
        yield hre.network.provider.send("evm_increaseTime", [THREE_MIN]);
        yield hre.network.provider.send("evm_mine", []);
        const [canExec, execData] = yield counterResolver.checker();
        chai_1.expect(canExec).to.be.eq(true);
        const depositAmount = ethers.utils.parseEther("0.5");
        yield helpers_1.getTokenFromFaucet(DAI, userAddress, depositAmount);
        yield dai.connect(user).approve(taskTreasury.address, depositAmount);
        yield taskTreasury
            .connect(user)
            .depositFunds(userAddress, DAI, depositAmount);
        yield chai_1.expect(pokeMe
            .connect(diamondSigner)
            .exec(ethers.utils.parseEther("1"), DAI, userAddress, true, resolverHash, counter.address, execData)).to.be.reverted;
        chai_1.expect(yield taskTreasury.userTokenBalance(userAddress, DAI)).to.be.eql(depositAmount);
    }));
    it("should exec and pay with ETH", () => __awaiter(this, void 0, void 0, function* () {
        const txFee = ethers.utils.parseEther("1");
        const [canExec, execData] = yield counterResolver.checker();
        chai_1.expect(canExec).to.be.eq(true);
        const THREE_MIN = 3 * 60;
        yield hre.network.provider.send("evm_increaseTime", [THREE_MIN]);
        yield hre.network.provider.send("evm_mine", []);
        chai_1.expect(yield counter.count()).to.be.eq(ethers.BigNumber.from("0"));
        const depositAmount = ethers.utils.parseEther("2");
        yield taskTreasury
            .connect(user)
            .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });
        chai_1.expect(yield taskTreasury.connect(user).userTokenBalance(userAddress, ETH)).to.be.eq(depositAmount);
        yield pokeMe
            .connect(diamondSigner)
            .exec(txFee, ETH, userAddress, true, resolverHash, counter.address, execData);
        chai_1.expect(yield counter.count()).to.be.eq(ethers.BigNumber.from("100"));
        chai_1.expect(yield taskTreasury.connect(user).userTokenBalance(userAddress, ETH)).to.be.eq(depositAmount.sub(txFee));
        // time not elapsed
        yield chai_1.expect(simulateExec(txFee, ETH, userAddress, true, resolverHash, counter.address, execData)).to.be.revertedWith("PokeMe.exec:Counter: increaseCount: Time not elapsed");
    }));
    it("should exec and pay with DAI", () => __awaiter(this, void 0, void 0, function* () {
        const txFee = ethers.utils.parseEther("1");
        const [canExec, execData] = yield counterResolver.checker();
        chai_1.expect(canExec).to.be.eq(true);
        const THREE_MIN = 3 * 60;
        yield hre.network.provider.send("evm_increaseTime", [THREE_MIN]);
        yield hre.network.provider.send("evm_mine", []);
        const depositAmount = ethers.utils.parseEther("2");
        yield helpers_1.getTokenFromFaucet(DAI, userAddress, depositAmount);
        yield dai.connect(user).approve(taskTreasury.address, depositAmount);
        yield taskTreasury
            .connect(user)
            .depositFunds(userAddress, DAI, depositAmount);
        chai_1.expect(yield taskTreasury.connect(user).userTokenBalance(userAddress, DAI)).to.be.eq(depositAmount);
        yield pokeMe
            .connect(diamondSigner)
            .exec(txFee, DAI, userAddress, true, resolverHash, counter.address, execData);
        chai_1.expect(yield counter.count()).to.be.eq(ethers.BigNumber.from("100"));
        // time not elapsed
        yield chai_1.expect(simulateExec(txFee, DAI, userAddress, true, resolverHash, counter.address, execData)).to.be.revertedWith("PokeMe.exec:Counter: increaseCount: Time not elapsed");
    }));
    it("should exec and charge user even when it reverts", () => __awaiter(this, void 0, void 0, function* () {
        const txFee = ethers.utils.parseEther("1");
        const [, execData] = yield counterResolver.checker();
        const depositAmount = ethers.utils.parseEther("2");
        yield taskTreasury
            .connect(user)
            .depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });
        // execute twice in a row
        yield pokeMe
            .connect(diamondSigner)
            .exec(txFee, ETH, userAddress, true, resolverHash, counter.address, execData);
        const count = yield counter.count();
        chai_1.expect(count).to.be.eq(ethers.BigNumber.from("100"));
        yield pokeMe
            .connect(diamondSigner)
            .exec(txFee, ETH, userAddress, true, resolverHash, counter.address, execData);
        chai_1.expect(yield counter.count()).to.be.eq(count);
        chai_1.expect(yield taskTreasury.userTokenBalance(userAddress, ETH)).to.be.eq(ethers.BigNumber.from("0"));
    }));
    it("getTaskIdsByUser test", () => __awaiter(this, void 0, void 0, function* () {
        // fake task
        yield pokeMe
            .connect(user)
            .createTask(userAddress, selector, counterResolver.address, resolverData);
        const ids = yield pokeMe.getTaskIdsByUser(userAddress);
        chai_1.expect(ids.length).to.be.eql(2);
    }));
    it("getCreditTokensByUser test", () => __awaiter(this, void 0, void 0, function* () {
        const depositAmount = ethers.utils.parseEther("1");
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
    const simulateExec = (_txFee, _feeToken, _taskCreator, _useTaskTreasury, _resolverHash, _execAddress, _execData) => __awaiter(this, void 0, void 0, function* () {
        const ZERO = ethers.constants.AddressZero;
        yield hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [ZERO],
        });
        const mockProvider = yield ethers.getSigner(ZERO);
        yield diamond.connect(owner).addExecutors([ZERO]);
        const pokeMeData = pokeMe.interface.encodeFunctionData("exec", [
            _txFee,
            _feeToken,
            _taskCreator,
            _useTaskTreasury,
            _resolverHash,
            _execAddress,
            _execData,
        ]);
        const execData = diamond.interface.encodeFunctionData("exec", [
            pokeMe.address,
            pokeMeData,
            _feeToken,
        ]);
        yield mockProvider.call({ to: diamondAddress, data: execData });
    });
});
