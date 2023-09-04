import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";

export const getTokenFromFaucet = async (
  tokenAddress: string,
  recepient: string,
  amount: BigNumber
) => {
  // Fetch actual Faucet
  const faucet = getFaucetByToken(tokenAddress.toLowerCase());
  if (!faucet) throw Error("Faucet not found");
  const faucetEthBalance = await (
    await ethers.provider.getSigner(faucet)
  ).getBalance();
  const oneEth = ethers.utils.parseEther("1");

  // Pre-fund faucet account with ETH to pay for tx fee
  if (
    faucet !== getFaucetByToken("0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") &&
    faucetEthBalance.lt(oneEth)
  ) {
    // Fund faucet account with ETH
    const ethFaucet = getFaucetByToken(
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
    );
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [ethFaucet],
    });
    const ethFaucetSigner = await ethers.provider.getSigner(ethFaucet);
    const ethSignerBalance = await ethFaucetSigner.getBalance();
    if (ethSignerBalance.lt(oneEth))
      throw Error(`ETH Faucet has insufficient: ${tokenAddress}`);
    const ethTx = await ethFaucetSigner.sendTransaction({
      to: faucet,
      value: oneEth,
    });
    await ethTx.wait();
  }

  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [faucet],
  });

  const faucetSigner = await ethers.provider.getSigner(faucet);

  const token = await ethers.getContractAt(
    [
      "function transfer(address _recepient, uint256 _amount) public",
      "function balanceOf(address _account) view returns(uint256)",
    ],
    tokenAddress,
    faucetSigner
  );

  const signerBalance = await token.balanceOf(faucet);
  if (signerBalance.lt(amount))
    throw Error(`Faucet has insufficient: ${tokenAddress}`);

  const tx = await token.connect(faucetSigner).transfer(recepient, amount);
  await tx.wait();
  const recepientBalance = await token.balanceOf(recepient);
  if (recepientBalance.lt(amount))
    throw Error(`Tranfer not succesfull: ${tokenAddress}`);
};

// @dev Faucet addresses must have payable fallback function
const getFaucetByToken = (tokenAddress: string): string => {
  switch (tokenAddress) {
    case "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee":
      return "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

    case "0x6b175474e89094c44da98b954eedeac495271d0f":
      return "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503";

    case "0xdd974d5c2e2928dea5f71b9825b8b646686bd200":
      return "0x3EB01B3391EA15CE752d01Cf3D3F09deC596F650";

    case "0x6810e776880c02933d47db1b9fc05908e5386b96":
      return "0xFBb1b73C4f0BDa4f67dcA266ce6Ef42f520fBB98";

    case "0x221657776846890989a759ba2973e427dff5c9bb":
      return "0x78D196056E1F369Ec2d563aAac504EA53462B30e";

    case "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48":
      return "0xc247722ac42b2f9ba752886502c3d3dd39bdb2da";

    case "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599":
      return "0xeDCdf2e84F2a6BA94B557B03BDFb7D10ecA5aa50";

    default:
      throw Error("No faucet found");
  }
};
