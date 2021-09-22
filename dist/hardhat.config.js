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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// PLUGINS
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@typechain/hardhat");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
// Process Env Variables
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: __dirname + "/.env" });
// Libraries
const assert_1 = __importDefault(require("assert"));
const ethers_1 = require("ethers");
// @dev Put this in .env
const ALCHEMY_ID = process.env.ALCHEMY_ID;
assert_1.default.ok(ALCHEMY_ID, "no Alchemy ID in process.env");
// @dev fill this out
const DEPLOYER_PK_MAINNET = process.env.DEPLOYER_PK_MAINNET;
const DEPLOYER_PK_ROPSTEN = process.env.DEPLOYER_PK_ROPSTEN;
const ETHERSCAN_API = process.env.ETHERSCAN_API;
// const ETHERSCAN_MATIC_API = process.env.ETHERSCAN_MATIC_API;
// const ETHERSCAN_FANTOM_API = process.env.ETHERSCAN_FANTOM_API;
// ================================= CONFIG =========================================
const config = {
    defaultNetwork: "hardhat",
    // hardhat-deploy
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
    networks: {
        goerli: {
            accounts: DEPLOYER_PK_ROPSTEN ? [DEPLOYER_PK_ROPSTEN] : [],
            chainId: 5,
            url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_ID}`,
            gasPrice: parseInt(ethers_1.utils.parseUnits("7", "gwei").toString()),
        },
        hardhat: {
            // Standard config
            // timeout: 150000,
            forking: {
                url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
                blockNumber: 12901600,
            },
        },
        matic: {
            url: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`,
            accounts: DEPLOYER_PK_MAINNET ? [DEPLOYER_PK_MAINNET] : [],
            gasPrice: parseInt(ethers_1.utils.parseUnits("30", "gwei").toString()),
        },
        mainnet: {
            accounts: DEPLOYER_PK_MAINNET ? [DEPLOYER_PK_MAINNET] : [],
            chainId: 1,
            url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
            gasPrice: parseInt(ethers_1.utils.parseUnits("100", "gwei").toString()),
        },
        rinkeby: {
            accounts: DEPLOYER_PK_MAINNET ? [DEPLOYER_PK_MAINNET] : [],
            chainId: 4,
            url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_ID}`,
            gasPrice: parseInt(ethers_1.utils.parseUnits("7", "gwei").toString()),
        },
        ropsten: {
            accounts: DEPLOYER_PK_ROPSTEN ? [DEPLOYER_PK_ROPSTEN] : [],
            chainId: 3,
            url: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_ID}`,
            gasPrice: parseInt(ethers_1.utils.parseUnits("7", "gwei").toString()),
        },
        fantom: {
            accounts: DEPLOYER_PK_MAINNET ? [DEPLOYER_PK_MAINNET] : [],
            chainId: 250,
            url: `https://rpcapi.fantom.network/`,
            gasPrice: parseInt(ethers_1.utils.parseUnits("80", "gwei").toString()),
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.0",
            },
        ],
    },
    typechain: {
        outDir: "typechain",
        target: "ethers-v5",
    },
    etherscan: {
        apiKey: ETHERSCAN_API,
    },
};
exports.default = config;
