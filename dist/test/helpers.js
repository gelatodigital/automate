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
exports.getTokenFromFaucet = void 0;
const hardhat_1 = require("hardhat");
const getTokenFromFaucet = (tokenAddress, recepient, amount) => __awaiter(void 0, void 0, void 0, function* () {
    // Fetch actual Faucet
    const faucet = getFaucetByToken(tokenAddress.toLowerCase());
    if (!faucet)
        throw Error("Faucet not found");
    const faucetEthBalance = yield (yield hardhat_1.ethers.provider.getSigner(faucet)).getBalance();
    const oneEth = hardhat_1.ethers.utils.parseEther("1");
    // Pre-fund faucet account with ETH to pay for tx fee
    if (faucet !== getFaucetByToken("0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") &&
        faucetEthBalance.lt(oneEth)) {
        // Fund faucet account with ETH
        const ethFaucet = getFaucetByToken("0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
        yield hardhat_1.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [ethFaucet],
        });
        const ethFaucetSigner = yield hardhat_1.ethers.provider.getSigner(ethFaucet);
        const ethSignerBalance = yield ethFaucetSigner.getBalance();
        if (ethSignerBalance.lt(oneEth))
            throw Error(`ETH Faucet has insufficient: ${tokenAddress}`);
        const ethTx = yield ethFaucetSigner.sendTransaction({
            to: faucet,
            value: oneEth,
        });
        yield ethTx.wait();
    }
    yield hardhat_1.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [faucet],
    });
    const faucetSigner = yield hardhat_1.ethers.provider.getSigner(faucet);
    const token = yield hardhat_1.ethers.getContractAt([
        "function transfer(address _recepient, uint256 _amount) public",
        "function balanceOf(address _account) view returns(uint256)",
    ], tokenAddress, faucetSigner);
    const signerBalance = yield token.balanceOf(faucet);
    if (signerBalance.lt(amount))
        throw Error(`Faucet has insufficient: ${tokenAddress}`);
    const tx = yield token.connect(faucetSigner).transfer(recepient, amount);
    yield tx.wait();
    const recepientBalance = yield token.balanceOf(recepient);
    if (recepientBalance.lt(amount))
        throw Error(`Tranfer not succesfull: ${tokenAddress}`);
});
exports.getTokenFromFaucet = getTokenFromFaucet;
// @dev Faucet addresses must have payable fallback function
const getFaucetByToken = (tokenAddress) => {
    switch (tokenAddress) {
        case "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee":
            return "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
        case "0x6b175474e89094c44da98b954eedeac495271d0f":
            return "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503";
        case "0xdd974d5c2e2928dea5f71b9825b8b646686bd200":
            return "0x3EB01B3391EA15CE752d01Cf3D3F09deC596F650";
        case "0x6810e776880c02933d47db1b9fc05908e5386b96":
            return "0xFBb1b73C4f0BDa4f67dcA266ce6Ef42f520fBB98";
        case "0x221657776846890989a759ba2973e427dff5c9bb":
            return "0x78D196056E1F369Ec2d563aAac504EA53462B30e";
        case "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48":
            return "0xc247722ac42b2f9ba752886502c3d3dd39bdb2da";
        default:
            throw Error("No facet found");
    }
};
