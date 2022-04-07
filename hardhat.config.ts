import { HardhatUserConfig } from "hardhat/config";

// PLUGINS
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-deploy-ethers";

// Process Env Variables
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });

// Libraries
import assert from "assert";
import { utils } from "ethers";

// @dev Put this in .env
const ALCHEMY_ID = process.env.ALCHEMY_ID;
assert.ok(ALCHEMY_ID, "no Alchemy ID in process.env");

// @dev fill this out
const DEPLOYER_PK_MAINNET = process.env.DEPLOYER_PK_MAINNET;
const DEPLOYER_PK_ROPSTEN = process.env.DEPLOYER_PK_ROPSTEN;
const ETHERSCAN_API = process.env.ETHERSCAN_API;
// const ETHERSCAN_MATIC_API = process.env.ETHERSCAN_MATIC_API;
// const ETHERSCAN_FANTOM_API = process.env.ETHERSCAN_FANTOM_API;
// const ETHERSCAN_ARBITRUM_API = process.env.ETHERSCAN_ARBITRUM_API;
// const ETHERSCAN_BSC_API = process.env.ETHERSCAN_BSC_API;
// const ETHERSCAN_AVALANCHE_API = process.env.ETHERSCAN_AVALANCHE_API;

// ================================= CONFIG =========================================
const config: HardhatUserConfig = {
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
      },
    },
    arbitrum: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 42161,
      accounts: DEPLOYER_PK_MAINNET ? [DEPLOYER_PK_MAINNET] : [],
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: DEPLOYER_PK_MAINNET ? [DEPLOYER_PK_MAINNET] : [],
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      accounts: DEPLOYER_PK_MAINNET ? [DEPLOYER_PK_MAINNET] : [],
    },
    fantom: {
      accounts: DEPLOYER_PK_MAINNET ? [DEPLOYER_PK_MAINNET] : [],
      chainId: 250,
      url: `https://rpcapi.fantom.network/`,
      gasPrice: parseInt(utils.parseUnits("80", "gwei").toString()),
    },
    gnosis: {
      url: "https://rpc.gnosischain.com",
      chainId: 100,
      accounts: DEPLOYER_PK_MAINNET ? [DEPLOYER_PK_MAINNET] : [],
    },
    goerli: {
      accounts: DEPLOYER_PK_ROPSTEN ? [DEPLOYER_PK_ROPSTEN] : [],
      chainId: 5,
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_ID}`,
      gasPrice: parseInt(utils.parseUnits("7", "gwei").toString()),
    },
    mainnet: {
      accounts: DEPLOYER_PK_MAINNET ? [DEPLOYER_PK_MAINNET] : [],
      chainId: 1,
      url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
      gasPrice: parseInt(utils.parseUnits("100", "gwei").toString()),
    },
    matic: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`,
      accounts: DEPLOYER_PK_MAINNET ? [DEPLOYER_PK_MAINNET] : [],
      gasPrice: parseInt(utils.parseUnits("30", "gwei").toString()),
    },
    rinkeby: {
      accounts: DEPLOYER_PK_MAINNET ? [DEPLOYER_PK_MAINNET] : [],
      chainId: 4,
      url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_ID}`,
      gasPrice: parseInt(utils.parseUnits("7", "gwei").toString()),
    },
    ropsten: {
      accounts: DEPLOYER_PK_ROPSTEN ? [DEPLOYER_PK_ROPSTEN] : [],
      chainId: 3,
      url: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_ID}`,
      gasPrice: parseInt(utils.parseUnits("7", "gwei").toString()),
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

export default config;
