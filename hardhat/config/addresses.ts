/* eslint-disable @typescript-eslint/naming-convention */

export const getGelatoAddress = (network: string): string | undefined => {
  const GELATO_MAINNET = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
  const GELATO_ROPSTEN = "0xCc4CcD69D31F9FfDBD3BFfDe49c6aA886DaB98d9";
  const GELATO_RINKEBY = "0x0630d1b8C2df3F0a68Df578D02075027a6397173";
  const GELATO_GOERLI = "0x683913B3A32ada4F8100458A3E1675425BdAa7DF";
  const GELATO_MATIC = "0x7598e84B2E114AB62CAB288CE5f7d5f6bad35BbA";
  const GELATO_FANTOM = "0xebA27A2301975FF5BF7864b99F55A4f7A457ED10";
  const GELATO_AVALANCHE = "0x7C5c4Af1618220C090A6863175de47afb20fa9Df";
  const GELATO_ARBITRUM = "0x4775aF8FEf4809fE10bf05867d2b038a4b5B2146";
  const GELATO_BSC = "0x7C5c4Af1618220C090A6863175de47afb20fa9Df";
  const GELATO_GNOSIS = "0x29b6603D17B9D8f021EcB8845B6FD06E1Adf89DE";

  switch (network) {
    case "mainnet":
      return GELATO_MAINNET;
    case "ropsten":
      return GELATO_ROPSTEN;
    case "rinkeby":
      return GELATO_RINKEBY;
    case "goerli":
      return GELATO_GOERLI;
    case "matic":
      return GELATO_MATIC;
    case "fantom":
      return GELATO_FANTOM;
    case "avalanche":
      return GELATO_AVALANCHE;
    case "arbitrum":
      return GELATO_ARBITRUM;
    case "bsc":
      return GELATO_BSC;
    case "gnosis":
      return GELATO_GNOSIS;
    case "hardhat":
      return GELATO_MAINNET;
    default:
      throw new Error("Gelato contract address not found");
  }
};
