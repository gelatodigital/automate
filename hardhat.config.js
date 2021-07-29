// Hardhat
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("hardhat-deploy-ethers");

// Libraries
const assert = require("assert");
const { utils } = require("ethers");

require("dotenv").config();

// @dev Put this in .env
const ALCHEMY_ID = process.env.ALCHEMY_ID;
assert.ok(ALCHEMY_ID, "no Alchemy ID in process.env");

// @dev fill this out
const DEPLOYER_PK_MAINNET = process.env.DEPLOYER_PK_MAINNET;
const DEPLOYER_PK_ROPSTEN = process.env.DEPLOYER_PK_ROPSTEN;
const ETHERSCAN_API = process.env.ETHERSCAN_API;

const GELATO = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6"

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  // hardhat-deploy
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  networks: {
    hardhat: {
      // Standard config
      // timeout: 150000,
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
        blockNumber: 12901600,
        GELATO
      },
    },
    mainnet: {
      accounts: DEPLOYER_PK_MAINNET ? [DEPLOYER_PK_MAINNET] : [],
      chainId: 1,
      url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
      gasPrice: parseInt(utils.parseUnits("1", "gwei")),
      GELATO: "0x3caca7b48d0573d793d3b0279b5f0029180e83b6"
    },

    ropsten: {
      accounts: DEPLOYER_PK_ROPSTEN ? [DEPLOYER_PK_ROPSTEN] : [],
      chainId: 3,
      url: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_ID}`,
      gasPrice: parseInt(utils.parseUnits("2", "gwei")),
      GELATO: "0xCc4CcD69D31F9FfDBD3BFfDe49c6aA886DaB98d9"
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.0",
      },
    ],
  },
  etherscan: {
    apiKey: ETHERSCAN_API,
  },
};
