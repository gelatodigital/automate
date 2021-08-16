/* eslint-disable @typescript-eslint/naming-convention */

export const getGelatoAddress = (network: string): string | undefined => {
  const GELATO_MAINNET = "0x3caca7b48d0573d793d3b0279b5f0029180e83b6";
  const GELATO_POLYGON = "0x7598e84B2E114AB62CAB288CE5f7d5f6bad35BbA";
  const GELATO_ROPSTEN = "0xCc4CcD69D31F9FfDBD3BFfDe49c6aA886DaB98d9";
  const GELATO_FANTOM = "0xebA27A2301975FF5BF7864b99F55A4f7A457ED10";

  switch (network) {
    case "mainnet":
      return GELATO_MAINNET;
    case "ropsten":
      return GELATO_ROPSTEN;
    case "matic":
      return GELATO_POLYGON;
    case "fantom":
      return GELATO_FANTOM;
  }
};
