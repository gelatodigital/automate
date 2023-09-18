import { ethers } from "hardhat";

export const getGelato1BalanceParam = (_parameters: {
  sponsor?: string;
  correlationId?: string;
}) => {
  let { sponsor, correlationId } = _parameters;

  if (!sponsor) {
    sponsor = ethers.Wallet.createRandom().address;
  }

  if (!correlationId) {
    const bytes = ethers.utils.randomBytes(32);
    correlationId = ethers.utils.hexlify(bytes);
  }

  return {
    sponsor,
    feeToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    oneBalanceChainId: 5,
    nativeToFeeTokenXRateNumerator: 1,
    nativeToFeeTokenXRateDenominator: 1,
    correlationId,
  };
};
