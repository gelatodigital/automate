import { HardhatUserConfig } from "hardhat/config";

// PLUGINS
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-verify";

// Process Env Variables
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });

// Libraries
import assert from "assert";

// @dev Put this in .env
const ALCHEMY_ID = process.env.ALCHEMY_ID;
assert.ok(ALCHEMY_ID, "no Alchemy ID in process.env");

// @dev fill this out
const PROD_PK = process.env.PROD_PK;
const DEV_PK = process.env.DEV_PK;
const ETHERSCAN_API = process.env.ETHERSCAN_MATIC_API;

// ================================= CONFIG =========================================
const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",

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
        blockNumber: 14068500,
      },
    },

    // Prod
    arbitrum: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 42161,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    cronos: {
      accounts: PROD_PK ? [PROD_PK] : [],
      chainId: 25,
      url: `https://evm.cronos.org`,
    },
    fantom: {
      accounts: PROD_PK ? [PROD_PK] : [],
      chainId: 250,
      url: `https://rpcapi.fantom.network/`,
    },
    gnosis: {
      url: "https://rpc.gnosischain.com",
      chainId: 100,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    mainnet: {
      accounts: PROD_PK ? [PROD_PK] : [],
      chainId: 1,
      url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
    },
    matic: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 137,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    moonbeam: {
      url: `https://rpc.api.moonbeam.network`,
      chainId: 1284,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    moonriver: {
      url: `https://rpc.api.moonriver.moonbeam.network`,
      chainId: 1285,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 80001,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    optimism: {
      url: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 10,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    zksync: {
      zksync: true,
      url: "https://mainnet.era.zksync.io",
      chainId: 324,
      accounts: PROD_PK ? [PROD_PK] : [],
      verifyURL:
        "https://zksync2-mainnet-explorer.zksync.io/contract_verification",
    },

    // Dev
    mumbaiDev: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 80001,
      accounts: DEV_PK ? [DEV_PK] : [],
    },

    // Staging
    arbgoerli: {
      url: "https://goerli-rollup.arbitrum.io/rpc",
      chainId: 421613,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    baseGoerli: {
      url: "https://goerli.base.org",
      chainId: 84531,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_ID}`,
      chainId: 5,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    ogoerli: {
      url: `https://opt-goerli.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 420,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
  },

  solidity: {
    compilers: [
      {
        version: "0.8.14",
      },
    ],
  },

  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },

  verify: {
    etherscan: {
      apiKey: ETHERSCAN_API,
    },
  },
};

export default config;
