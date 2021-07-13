// Hardhat
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("hardhat-deploy-ethers");

// Libraries
const assert = require("assert");
const { utils } = require("ethers");

require("dotenv").config();

// @dev Put this in .env
const ALCHEMY_ID = process.env.ALCHEMY_ID;
assert.ok(ALCHEMY_ID, "no Alchemy ID in process.env");

// @dev fill this out
const DEPLOYER_MAINNET = "0xAabB54394E8dd61Dd70897E9c80be8de7C64A895";
const DEPLOYER_PK_MAINNET = process.env.DEPLOYER_PK_MAINNET;
const DEPLOYER_RINKEBY = "0xAabB54394E8dd61Dd70897E9c80be8de7C64A895";
const DEPLOYER_PK_RINKEBY = process.env.DEPLOYER_PK_RINKEBY;
const DEPLOYER_ROPSTEN = "0x4B5BaD436CcA8df3bD39A095b84991fAc9A226F1";
const DEPLOYER_PK_ROPSTEN = process.env.DEPLOYER_PK_ROPSTEN;

const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const USD_ADDRESS = "0x7354C81fbCb229187480c4f497F945C6A312d5C3";

const mainnetAddresses = {
  ethAddress: ETH_ADDRESS,
  usdAddress: USD_ADDRESS,
  aaveAddress: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
  adxAddress: "0xADE00C28244d5CE17D72E40330B1c318cD12B7c3",
  balAddress: "0xba100000625a3754423978a60c9317c58a424e3D",
  batAddress: "0x0D8775F648430679A709E98d2b0Cb6250d2887EF",
  bnbAddress: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
  bntAddress: "0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C",
  busdAddress: "0x4Fabb145d64652a948d72533023f6E7A623C7C53",
  bzrxAddress: "0x56d811088235F11C8920698a204A5010a788f4b3",
  compAddress: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
  croAddress: "0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b",
  daiAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  enjAddress: "0x24D9aB51950F3d62E9144fdC2f3135DAA6Ce8D1B",
  kncAddress: "0xdd974D5C2e2928deA5F71b9825b8b646686BD200",
  linkAddress: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
  lrcAddress: "0xBBbbCA6A901c926F240b89EacB641d8Aec7AEafD",
  manaAddress: "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942",
  mkrAddress: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
  nmrAddress: "0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671",
  renAddress: "0x408e41876cCCDC0F92210600ef50372656052a38",
  repAddress: "0x221657776846890989a759BA2973e427DfF5C9bB",
  snxAddress: "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F",
  susdAddress: "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51",
  sxpAddress: "0x8CE9137d39326AD0cD6491fb5CC0CbA0e089b6A9",
  tusdAddress: "0x0000000000085d4780B73119b644AE5ecd22b376",
  uniAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  usdcAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  usdkAddress: "0x1c48f86ae57291F7686349F12601910BD8D470bb",
  usdtAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  wethAddress: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  wbtcAddress: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
  womAddress: "0xa982B2e19e90b2D9F7948e9C1b65D119F1CE88D6",
  yfiAddress: "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e",
  zrxAddress: "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
};

const rinkebyAddresses = {
  ethAddress: ETH_ADDRESS,
  usdAddress: USD_ADDRESS,
  batAddress: "0xbF7A7169562078c96f0eC1A8aFD6aE50f12e5A99",
  daiAddress: "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa",
  linkAddress: "0x01BE23585060835E02B77ef475b0Cc51aA1e0709",
  repAddress: "0x6e894660985207feb7cf89Faf048998c71E8EE89",
  snxAddress: "0xcBBb17D9767bD57FBF4Bbf8842E916bCb3826ec1",
  usdcAddress: "0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b",
  wethAddress: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
  zrxAddress: "0xddea378A6dDC8AfeC82C36E9b0078826bf9e68B6",
};

const ropstenAddresses = {
  ethAddress: ETH_ADDRESS,
  usdAddress: USD_ADDRESS,
  daiAddress: "0xaD6D458402F60fD3Bd25163575031ACDce07538D",
  usdcAddress: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
  wethAddress: "0xbCA556c912754Bc8E7D4Aad20Ad69a1B1444F42d",
  wbtcAddress: "0xBde8bB00A7eF67007A96945B3a3621177B615C44",
};

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    maxMethodDiff: 25,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  // hardhat-deploy
  namedAccounts: {
    deployer: {
      default: 0,
      mainnet: DEPLOYER_MAINNET,
      rinkeby: DEPLOYER_RINKEBY,
      ropsten: DEPLOYER_ROPSTEN,
    },
  },
  networks: {
    hardhat: {
      // Standard config
      // timeout: 150000,
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
        blockNumber: 12645718,
      },
      // Custom
      GelatoCore: "0x1d681d76ce96E4d70a88A00EBbcfc1E47808d0b8",
      ...mainnetAddresses,
    },

    mainnet: {
      accounts: DEPLOYER_PK_MAINNET ? [DEPLOYER_PK_MAINNET] : [],
      chainId: 1,
      url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
      gasPrice: parseInt(utils.parseUnits("1", "gwei")),
      ...mainnetAddresses,
    },

    rinkeby: {
      accounts: DEPLOYER_PK_RINKEBY ? [DEPLOYER_PK_RINKEBY] : [],
      chainId: 4,
      url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_ID}`,
      gasPrice: parseInt(utils.parseUnits("2", "gwei")),
      ...rinkebyAddresses,
    },
    ropsten: {
      accounts: DEPLOYER_PK_ROPSTEN ? [DEPLOYER_PK_ROPSTEN] : [],
      chainId: 3,
      url: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_ID}`,
      gasPrice: parseInt(utils.parseUnits("5", "gwei")),
      ...ropstenAddresses,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.0",
      },
    ],
  },
};
