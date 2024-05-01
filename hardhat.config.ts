import { HardhatUserConfig } from "hardhat/config";

// PLUGINS
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-verify";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-deploy";

// Process Env Variables
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });

// Libraries
import assert from "assert";

// @dev Put this in .env
const ALCHEMY_ID = process.env.ALCHEMY_ID;
assert.ok(ALCHEMY_ID, "no Alchemy ID in process.env");
const INFURA_ID = process.env.INFURA_ID;
assert.ok(INFURA_ID, "no Infura ID in process.env");

// @dev fill this out
const PROD_PK = process.env.PROD_PK;
const DEV_PK = process.env.DEV_PK;
const ETHERSCAN_API = process.env.ETHERSCAN_API;

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
        blockNumber: 18000000,
      },
    },

    // Local
    zksyncLocal: {
      url: "http://localhost:3050",
      zksync: true,
      accounts: [
        "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110", //0x36615Cf349d7F6344891B1e7CA7C72883F5dc049
        "0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3", //0xa61464658AfeAf65CccaaFD3a512b69A83B77618
      ],
    },

    // Prod
    arbitrum: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 42161,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    astarzkevm: {
      url: "https://rpc.astar-zkevm.gelato.digital",
      chainId: 3776,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    base: {
      url: `https://mainnet.base.org`,
      chainId: 8453,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    blast: {
      url: `https://blastl2-mainnet.public.blastapi.io`,
      chainId: 81457,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    fantom: {
      accounts: PROD_PK ? [PROD_PK] : [],
      chainId: 250,
      url: `https://rpcapi.fantom.network/`,
    },
    gnosis: {
      accounts: PROD_PK ? [PROD_PK] : [],
      chainId: 100,
      url: `https://gnosis-mainnet.public.blastapi.io`,
    },
    linea: {
      url: `https://linea-mainnet.infura.io/v3/${INFURA_ID}`,
      chainId: 59144,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    mainnet: {
      accounts: PROD_PK ? [PROD_PK] : [],
      chainId: 1,
      url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
    },
    metis: {
      accounts: PROD_PK ? [PROD_PK] : [],
      chainId: 1088,
      url: "https://metis-mainnet.public.blastapi.io",
    },
    mode: {
      url: `https://mainnet.mode.network`,
      chainId: 34443,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    optimism: {
      url: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 10,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    playblock: {
      url: `https://rpc.playblock.io`,
      chainId: 1829,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 137,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    polygonzk: {
      url: "https://zkevm-rpc.com",
      chainId: 1101,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    real: {
      url: "https://rpc.realforreal.gelato.digital/",
      chainId: 111188,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    reyanetwork: {
      url: "https://rpc.reya.network",
      chainId: 1729,
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
    amoyDev: {
      url: `https://rpc-amoy.polygon.technology`,
      chainId: 80002,
      accounts: DEV_PK ? [DEV_PK] : [],
    },
    gelatoorbittestnetDev: {
      url: `https://rpc.arb-blueberry.gelato.digital`,
      chainId: 88153591557,
      accounts: DEV_PK ? [DEV_PK] : [],
    },

    // Staging
    amoy: {
      url: `https://rpc-amoy.polygon.technology`,
      chainId: 80002,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    arbgoerli: {
      url: "https://goerli-rollup.arbitrum.io/rpc",
      chainId: 421613,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    arbsepolia: {
      url: `https://sepolia-rollup.arbitrum.io/rpc`,
      chainId: 421614,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    astarzkyoto: {
      url: `https://rpc.zkyoto.gelato.digital`,
      chainId: 6038361,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    basesepolia: {
      url: `https://sepolia.base.org`,
      chainId: 84532,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    baseGoerli: {
      url: "https://goerli.base.org",
      chainId: 84531,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    blackberry: {
      url: `https://rpc.polygon-blackberry.gelato.digital`,
      chainId: 94204209,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    blastsepolia: {
      url: `https://sepolia.blast.io`,
      chainId: 168587773,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    connextsepolia: {
      url: `https://rpc.connext-sepolia.gelato.digital`,
      chainId: 6398,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    gelopcelestiatestnet: {
      url: `https://rpc.op-celestia-testnet.gelato.digital`,
      chainId: 123420111,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    geloptestnet: {
      url: `https://rpc.op-testnet.gelato.digital`,
      chainId: 42069,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    gelatoorbittestnet: {
      url: `https://rpc.arb-blueberry.gelato.digital`,
      chainId: 88153591557,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_ID}`,
      chainId: 5,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    lisksepolia: {
      url: `https://rpc.lisk-sepolia-testnet.gelato.digital`,
      chainId: 4202,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 80001,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    ogoerli: {
      url: `https://opt-goerli.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 420,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    osepolia: {
      url: `https://sepolia.optimism.io`,
      chainId: 11155420,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    reyacronos: {
      url: `https://rpc.reya-cronos.gelato.digital`,
      chainId: 89346161,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 11155111,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    unreal: {
      url: `https://rpc.unreal.gelato.digital`,
      chainId: 18231,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    unrealorbit: {
      url: `https://rpc.unreal-orbit.gelato.digital`,
      chainId: 18233,
      accounts: PROD_PK ? [PROD_PK] : [],
    },
    zkatana: {
      url: "https://rpc.zkatana.gelato.digital",
      chainId: 1261120,
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
