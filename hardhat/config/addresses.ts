/* eslint-disable @typescript-eslint/naming-convention */

export const getGelatoAddress = (network: string): string | undefined => {
  const GELATO_MAINNET = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
  const GELATO_MATIC = "0x7598e84B2E114AB62CAB288CE5f7d5f6bad35BbA";
  const GELATO_FANTOM = "0xebA27A2301975FF5BF7864b99F55A4f7A457ED10";
  const GELATO_AVALANCHE = "0x7C5c4Af1618220C090A6863175de47afb20fa9Df";
  const GELATO_ARBITRUM = "0x4775aF8FEf4809fE10bf05867d2b038a4b5B2146";
  const GELATO_BSC = "0x7C5c4Af1618220C090A6863175de47afb20fa9Df";
  const GELATO_GNOSIS = "0x29b6603D17B9D8f021EcB8845B6FD06E1Adf89DE";

  const GELATO_ROPSTEN = "0xCc4CcD69D31F9FfDBD3BFfDe49c6aA886DaB98d9";
  const GELATO_RINKEBY = "0x0630d1b8C2df3F0a68Df578D02075027a6397173";
  const GELATO_GOERLI = "0x683913B3A32ada4F8100458A3E1675425BdAa7DF";
  const GELATO_MUMBAI = "0x25aD59adbe00C2d80c86d01e2E05e1294DA84823";

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
    case "mumbai":
      return GELATO_MUMBAI;
    case "hardhat":
      return GELATO_MAINNET;
    default:
      throw new Error("No gelato address for network");
  }
};

export const getOldTaskTreasuryAddress = (
  network: string
): string | undefined => {
  const TREASURY_MAINNET = "0x66e2F69df68C8F56837142bE2E8C290EfE76DA9f";
  const TREASURY_MATIC = "0xA8a7BBe83960B29789d5CB06Dcd2e6C1DF20581C";
  const TREASURY_FANTOM = "0x6c3224f9b3feE000A444681d5D45e4532D5BA531";
  const TREASURY_AVALANCHE = "0x63C51b1D80B209Cf336Bec5a3E17D3523B088cdb";
  const TREASURY_ARBITRUM = "0x527a819db1eb0e34426297b03bae11F2f8B3A19E";
  const TREASURY_BSC = "0x63C51b1D80B209Cf336Bec5a3E17D3523B088cdb";
  const TREASURY_GNOSIS = "0x95f4538C3950CE0EF5821f2049aE2aC5cCade68D";

  const TREASURY_ROPSTEN = "0x2705aCca70CdB3E326C1013eEA2c03A4f2935b66";
  const TREASURY_RINKEBY = "0x90F609c73F7498dD031e0dAfF3B40e93c04a6C60";
  const TREASURY_GOERLI = "0xA0Cc0CC82d945D96D4F481A62C968AfCCea1C54F";
  const TREASURY_MUMBAI = "0x63C51b1D80B209Cf336Bec5a3E17D3523B088cdb";

  switch (network) {
    case "mainnet":
      return TREASURY_MAINNET;
    case "ropsten":
      return TREASURY_ROPSTEN;
    case "rinkeby":
      return TREASURY_RINKEBY;
    case "goerli":
      return TREASURY_GOERLI;
    case "matic":
      return TREASURY_MATIC;
    case "fantom":
      return TREASURY_FANTOM;
    case "avalanche":
      return TREASURY_AVALANCHE;
    case "arbitrum":
      return TREASURY_ARBITRUM;
    case "bsc":
      return TREASURY_BSC;
    case "gnosis":
      return TREASURY_GNOSIS;
    case "mumbai":
      return TREASURY_MUMBAI;
    case "hardhat":
      return TREASURY_MAINNET;
    default:
      throw new Error("No old task treasury address for network");
  }
};
