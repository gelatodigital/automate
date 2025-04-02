import hre from "hardhat";
/* eslint-disable @typescript-eslint/naming-convention */
export interface Addresses {
  GELATO: string;
}

export const getAddresses = (
  network: string,
  isDynamicNetwork: boolean
): Addresses => {
  if (isDynamicNetwork) {
    return hre.network.contracts;
  }
  switch (network) {
    case "alephzerotestnet":
      return {
        GELATO: "0x30056FD86993624B72c7400bB4D7b29F05928E59",
      };
    case "amoy":
      return {
        GELATO: "0x30056FD86993624B72c7400bB4D7b29F05928E59",
      };
    case "amoyDev":
      return {
        GELATO: "0x963F2BeF2e6ac7764576bF449011eCcc759C0324",
      };
    case "anomalyandromeda":
      return {
        GELATO: "0x30056FD86993624B72c7400bB4D7b29F05928E59",
      };
    case "arbgoerli":
      return {
        GELATO: "0xF82D64357D9120a760e1E4C75f646C0618eFc2F3",
      };
    case "arbitrum":
      return {
        GELATO: "0x4775aF8FEf4809fE10bf05867d2b038a4b5B2146",
      };
    case "arbsepolia":
      return {
        GELATO: "0xF82D64357D9120a760e1E4C75f646C0618eFc2F3",
      };
    case "astarzkevm":
      return {
        GELATO: "0xa2351354b39977ea35b1C28A035BD94e48F3ED7D",
      };
    case "astarzkyoto":
      return {
        GELATO: "0x683913B3A32ada4F8100458A3E1675425BdAa7DF",
      };
    case "avalanche":
      return {
        GELATO: "0x7C5c4Af1618220C090A6863175de47afb20fa9Df",
      };
    case "base":
      return {
        GELATO: "0x08EFb6D315c7e74C39620c9AAEA289730f43a429",
      };
    case "baseGoerli":
      return {
        GELATO: "0xbe77Cd403Be3F2C7EEBC3427360D3f9e5d528F43",
      };
    case "basesepolia":
      return {
        GELATO: "0x683913B3A32ada4F8100458A3E1675425BdAa7DF",
      };
    case "blackberry":
      return {
        GELATO: "0x30056FD86993624B72c7400bB4D7b29F05928E59",
      };
    case "blast":
      return {
        GELATO: "0xFec1E33eBe899906Ff63546868A26E1028700b0e",
      };
    case "blastsepolia":
      return {
        GELATO: "0xF82D64357D9120a760e1E4C75f646C0618eFc2F3",
      };
    case "bsc":
      return {
        GELATO: "0x7C5c4Af1618220C090A6863175de47afb20fa9Df",
      };
    case "campnetworktestnet":
      return {
        GELATO: "0x30056FD86993624B72c7400bB4D7b29F05928E59",
      };
    case "connextsepolia":
      return {
        GELATO: "0x30056FD86993624B72c7400bB4D7b29F05928E59",
      };
    case "coredao":
      return {
        GELATO: "0x6e1A85E0Ee2893C005eDB99c8Ca4c03d9a309Ed4",
      };
    case "cronos":
      return {
        GELATO: "0x91f2A140cA47DdF438B9c583b7E71987525019bB",
      };
    case "fantom":
      return {
        GELATO: "0xebA27A2301975FF5BF7864b99F55A4f7A457ED10",
      };
    case "gelopcelestiatestnet":
      return {
        GELATO: "0x30056FD86993624B72c7400bB4D7b29F05928E59",
      };
    case "gelatoorbittestnet":
      return {
        GELATO: "0x683913B3A32ada4F8100458A3E1675425BdAa7DF",
      };
    case "gelatoorbittestnetDev":
      return {
        GELATO: "0xaB0A8DCb1590C4565C35cC785dc25A0590398054",
      };
    case "geloptestnet":
      return {
        GELATO: "0xF82D64357D9120a760e1E4C75f646C0618eFc2F3",
      };
    case "gnosis":
      return {
        GELATO: "0x29b6603D17B9D8f021EcB8845B6FD06E1Adf89DE",
      };
    case "goerli":
      return {
        GELATO: "0x683913B3A32ada4F8100458A3E1675425BdAa7DF",
      };
    case "hardhat":
      return {
        GELATO: "0x3caca7b48d0573d793d3b0279b5f0029180e83b6",
      };
    case "linea":
      return {
        GELATO: "0xc2a813699bF2353380c625e3D6b544dC42963941",
      };
    case "lisk":
      return {
        GELATO: "0xb0cb899251086ed70e5d2c8d733D2896Fd989850",
      };
    case "lisksepolia":
      return {
        GELATO: "0xF82D64357D9120a760e1E4C75f646C0618eFc2F3",
      };
    case "mainnet":
      return {
        GELATO: "0x3CACa7b48D0573D793d3b0279b5F0029180E83b6",
      };
    case "metis":
      return {
        GELATO: "0xFec1E33eBe899906Ff63546868A26E1028700b0e",
      };
    case "mode":
      return {
        GELATO: "0xFec1E33eBe899906Ff63546868A26E1028700b0e",
      };
    case "moonbeam":
      return {
        GELATO: "0x91f2A140cA47DdF438B9c583b7E71987525019bB",
      };
    case "moonriver":
      return {
        GELATO: "0x91f2A140cA47DdF438B9c583b7E71987525019bB",
      };
    case "mumbai":
      return {
        GELATO: "0x25aD59adbe00C2d80c86d01e2E05e1294DA84823",
      };
    case "mumbaiDev":
      return {
        GELATO: "0x266E4AB6baD069aFc28d3C2CC129f6F8455b1dc2",
      };
    case "novastrotestnet":
      return {
        GELATO: "0x30056FD86993624B72c7400bB4D7b29F05928E59",
      };
    case "ogoerli":
      return {
        GELATO: "0xF82D64357D9120a760e1E4C75f646C0618eFc2F3",
      };
    case "opencampuscodex":
      return {
        GELATO: "0x30056FD86993624B72c7400bB4D7b29F05928E59",
      };
    case "optimism":
      return {
        GELATO: "0x01051113D81D7d6DA508462F2ad6d7fD96cF42Ef",
      };
    case "osepolia":
      return {
        GELATO: "0x2d4E9d6ac373d09033BF0b6579A881bF84B9Ee3A",
      };
    case "playblock":
      return {
        GELATO: "0xb0cb899251086ed70e5d2c8d733D2896Fd989850",
      };
    case "polygon":
      return {
        GELATO: "0x7598e84B2E114AB62CAB288CE5f7d5f6bad35BbA",
      };
    case "polygonzk":
      return {
        GELATO: "0x08EFb6D315c7e74C39620c9AAEA289730f43a429",
      };
    case "real":
      return {
        GELATO: "0xb0cb899251086ed70e5d2c8d733D2896Fd989850",
      };
    case "reyacronos":
      return {
        GELATO: "0x30056FD86993624B72c7400bB4D7b29F05928E59",
      };
    case "reyanetwork":
      return {
        GELATO: "0xb0cb899251086ed70e5d2c8d733D2896Fd989850",
      };
    case "ridottotetromino":
      return {
        GELATO: "0xF82D64357D9120a760e1E4C75f646C0618eFc2F3",
      };
    case "rootstock":
      return {
        GELATO: "0xb0cb899251086ed70e5d2c8d733D2896Fd989850",
      };
    case "sepolia":
      return {
        GELATO: "0xCf8EDB3333Fae73b23f689229F4De6Ac95d1f707",
      };
    case "unreal":
      return {
        GELATO: "0xF82D64357D9120a760e1E4C75f646C0618eFc2F3",
      };
    case "unrealOrbit":
      return {
        GELATO: "0x30056FD86993624B72c7400bB4D7b29F05928E59",
      };
    case "zkatana":
      return {
        GELATO: "0xF82D64357D9120a760e1E4C75f646C0618eFc2F3",
      };
    case "zksync":
      return {
        GELATO: "0x52cb9f60225aA830AE420126BC8e3d5B2fc5bCf4",
      };
    case "zksyncGoerli":
      return {
        GELATO: "0x296530a4224D5A5669a3f0C772EC7337ca3D3f1d",
      };
    case "zksyncLocal":
      return {
        GELATO: "0x52cb9f60225aA830AE420126BC8e3d5B2fc5bCf4",
      };
    case "abstract":
      return {
        GELATO: "0xDFE7B0112D9D8B3ebe59529C5D37F026A311d393",
      };

    default:
      throw new Error(`No addresses for Network: ${network}`);
  }
};
