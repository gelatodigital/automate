export interface Addresses {
  GELATO_MAINNET: string;
  GELATO_POLYGON: string;
  GELATO_ROPSTEN: string;
}

export const getAddresses = (): Addresses => {
  return {
    GELATO_MAINNET: "0x3caca7b48d0573d793d3b0279b5f0029180e83b6",
    GELATO_POLYGON: "0x7598e84B2E114AB62CAB288CE5f7d5f6bad35BbA",
    GELATO_ROPSTEN: "0xCc4CcD69D31F9FfDBD3BFfDe49c6aA886DaB98d9",
  };
};
