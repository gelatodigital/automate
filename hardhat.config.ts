import { extendEnvironment, HardhatUserConfig } from "hardhat/config";
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
import { ethers } from "ethers";
import { verifyRequiredEnvVar } from "./src/utils";

// @dev Put this in .env
const ALCHEMY_ID = process.env.ALCHEMY_ID;
assert.ok(ALCHEMY_ID, "no Alchemy ID in process.env");
const INFURA_ID = process.env.INFURA_ID;
assert.ok(INFURA_ID, "no Infura ID in process.env");

// @dev fill this out
const AUTOMATE_DEPLOYER_PK = process.env.AUTOMATE_DEPLOYER_PK;
const ETHERSCAN_API = process.env.ETHERSCAN_API;

if (!AUTOMATE_DEPLOYER_PK) {
  throw new Error("AUTOMATE_DEPLOYER_PK is missing");
}
const accounts: string[] = [AUTOMATE_DEPLOYER_PK];

extendEnvironment((hre) => {
  if (hre.network.name === "dynamic") {
    hre.network.isDynamic = true;
    const networkName = process.env.HARDHAT_DYNAMIC_NETWORK_NAME as
      | string
      | undefined;
    const networkUrl = process.env.HARDHAT_DYNAMIC_NETWORK_URL as
      | string
      | undefined;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const noDeterministicDeployment = process.env
      .HARDHAT_DYNAMIC_NETWORK_NO_DETERMINISTIC_DEPLOYMENT as
      | string
      | undefined;
    const gelatoContractAddress = process.env
      .HARDHAT_DYNAMIC_NETWORK_CONTRACTS_GELATO as string | undefined;

    verifyRequiredEnvVar("HARDHAT_DYNAMIC_NETWORK_NAME", networkName);
    verifyRequiredEnvVar("HARDHAT_DYNAMIC_NETWORK_URL", networkUrl);
    verifyRequiredEnvVar(
      "HARDHAT_DYNAMIC_NETWORK_CONTRACTS_GELATO",
      gelatoContractAddress
    );

    hre.network.name = networkName;
    hre.network.config.url = networkUrl;
    hre.network.contracts = {
      GELATO: ethers.utils.getAddress(gelatoContractAddress),
    };
    hre.network.noDeterministicDeployment =
      noDeterministicDeployment === "true";
  } else {
    hre.network.isDynamic = false;
    hre.network.noDeterministicDeployment = hre.network.config.zksync ?? false;
  }
});

// ================================= CONFIG =========================================
const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",

  namedAccounts: {
    deployer: {
      default: 0,
    },
  },

  networks: {
    dynamic: {
      accounts,
      url: "",
    },

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
      accounts: accounts,
    },
    astarzkevm: {
      url: "https://rpc.astar-zkevm.gelato.digital",
      chainId: 3776,
      accounts: accounts,
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: accounts,
    },
    base: {
      url: `https://mainnet.base.org`,
      chainId: 8453,
      accounts: accounts,
    },
    blast: {
      url: `https://blastl2-mainnet.public.blastapi.io`,
      chainId: 81457,
      accounts: accounts,
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      accounts: accounts,
    },
    coredao: {
      url: `https://rpc.coredao.org`,
      chainId: 1116,
      accounts: accounts,
    },
    fantom: {
      accounts: accounts,
      chainId: 250,
      url: `https://rpcapi.fantom.network/`,
    },
    gnosis: {
      accounts: accounts,
      chainId: 100,
      url: `https://gnosis-mainnet.public.blastapi.io`,
    },
    linea: {
      url: `https://linea-mainnet.infura.io/v3/${INFURA_ID}`,
      chainId: 59144,
      accounts: accounts,
    },
    lisk: {
      url: `https://rpc.api.lisk.com`,
      chainId: 1135,
      accounts: accounts,
    },
    mainnet: {
      accounts: accounts,
      chainId: 1,
      url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
    },
    metis: {
      accounts: accounts,
      chainId: 1088,
      url: "https://metis-mainnet.public.blastapi.io",
    },
    mode: {
      url: `https://mainnet.mode.network`,
      chainId: 34443,
      accounts: accounts,
    },
    optimism: {
      url: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 10,
      accounts: accounts,
    },
    playblock: {
      url: `https://rpc.playblock.io`,
      chainId: 1829,
      accounts: accounts,
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 137,
      accounts: accounts,
    },
    polygonzk: {
      url: "https://zkevm-rpc.com",
      chainId: 1101,
      accounts: accounts,
    },
    real: {
      url: "https://rpc.realforreal.gelato.digital/",
      chainId: 111188,
      accounts: accounts,
    },
    reyanetwork: {
      url: "https://rpc.reya.network",
      chainId: 1729,
      accounts: accounts,
    },
    rootstock: {
      url: `https://public-node.rsk.co`,
      chainId: 30,
      accounts: accounts,
    },
    zksync: {
      zksync: true,
      url: "https://mainnet.era.zksync.io",
      chainId: 324,
      accounts: accounts,
      verifyURL:
        "https://zksync2-mainnet-explorer.zksync.io/contract_verification",
    },

    // Dev
    mumbaiDev: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 80001,
      accounts: accounts,
    },
    amoyDev: {
      url: `https://rpc-amoy.polygon.technology`,
      chainId: 80002,
      accounts: accounts,
    },
    gelatoorbittestnetDev: {
      url: `https://rpc.arb-blueberry.gelato.digital`,
      chainId: 88153591557,
      accounts: accounts,
    },

    // Staging
    alephzerotestnet: {
      url: `https://rpc.alephzero-testnet.gelato.digital`,
      chainId: 2039,
      accounts: accounts,
    },
    amoy: {
      url: `https://rpc-amoy.polygon.technology`,
      chainId: 80002,
      accounts: accounts,
    },
    anomalyandromeda: {
      url: `https://rpc.anomaly-andromeda.anomalygames.io`,
      chainId: 241120,
      accounts: accounts,
    },
    arbgoerli: {
      url: "https://goerli-rollup.arbitrum.io/rpc",
      chainId: 421613,
      accounts: accounts,
    },
    arbsepolia: {
      url: `https://sepolia-rollup.arbitrum.io/rpc`,
      chainId: 421614,
      accounts: accounts,
    },
    astarzkyoto: {
      url: `https://rpc.zkyoto.gelato.digital`,
      chainId: 6038361,
      accounts: accounts,
    },
    basesepolia: {
      url: `https://sepolia.base.org`,
      chainId: 84532,
      accounts: accounts,
    },
    baseGoerli: {
      url: "https://goerli.base.org",
      chainId: 84531,
      accounts: accounts,
    },
    blackberry: {
      url: `https://rpc.polygon-blackberry.gelato.digital`,
      chainId: 94204209,
      accounts: accounts,
    },
    blastsepolia: {
      url: `https://sepolia.blast.io`,
      chainId: 168587773,
      accounts: accounts,
    },
    campnetworktestnet: {
      url: `https://rpc.camp-network-testnet.gelato.digital`,
      chainId: 325000,
      accounts: accounts,
    },
    connextsepolia: {
      url: `https://rpc.connext-sepolia.gelato.digital`,
      chainId: 6398,
      accounts: accounts,
    },
    gelopcelestiatestnet: {
      url: `https://rpc.op-celestia-testnet.gelato.digital`,
      chainId: 123420111,
      accounts: accounts,
    },
    geloptestnet: {
      url: `https://rpc.op-testnet.gelato.digital`,
      chainId: 42069,
      accounts: accounts,
    },
    gelatoorbittestnet: {
      url: `https://rpc.arb-blueberry.gelato.digital`,
      chainId: 88153591557,
      accounts: accounts,
    },
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_ID}`,
      chainId: 5,
      accounts: accounts,
    },
    lisksepolia: {
      url: `https://rpc.lisk-sepolia-testnet.gelato.digital`,
      chainId: 4202,
      accounts: accounts,
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 80001,
      accounts: accounts,
    },
    novastrotestnet: {
      url: `https://rpc.novastro-testnet.gelato.digital`,
      chainId: 560098,
      accounts: accounts,
    },
    ogoerli: {
      url: `https://opt-goerli.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 420,
      accounts: accounts,
    },
    opencampuscodex: {
      url: `https://rpc.open-campus-codex.gelato.digital`,
      chainId: 656476,
      accounts: accounts,
    },
    osepolia: {
      url: `https://sepolia.optimism.io`,
      chainId: 11155420,
      accounts: accounts,
    },
    reyacronos: {
      url: `https://rpc.reya-cronos.gelato.digital`,
      chainId: 89346162,
      accounts: accounts,
    },
    ludicotetromino: {
      url: `https://rpc.ludico-tetromino.gelato.digital`,
      chainId: 4444,
      accounts: accounts,
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 11155111,
      accounts: accounts,
    },
    unreal: {
      url: `https://rpc.unreal.gelato.digital`,
      chainId: 18231,
      accounts: accounts,
    },
    unrealorbit: {
      url: `https://rpc.unreal-orbit.gelato.digital`,
      chainId: 18233,
      accounts: accounts,
    },
    zkatana: {
      url: "https://rpc.zkatana.gelato.digital",
      chainId: 1261120,
      accounts: accounts,
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
