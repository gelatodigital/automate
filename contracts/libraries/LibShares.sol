// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;
import {ETH} from "../vendor/gelato/FGelato.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

library LibShares {
    function contractBalance(address _token) internal view returns (uint256) {
        if (_token == ETH) {
            return address(this).balance;
        } else {
            return IERC20(_token).balanceOf(address(this));
        }
    }

    function tokenToShares(
        uint256 _tokenAmount,
        uint256 _totalShares,
        uint256 _totalBalance
    ) internal pure returns (uint256) {
        uint256 sharesOfToken;

        // credit shares equivalent to token amount
        if (_totalShares == 0 || _totalBalance == 0) {
            sharesOfToken = _tokenAmount;
        } else {
            sharesOfToken = (_tokenAmount * _totalShares) / _totalBalance;
        }

        return sharesOfToken;
    }

    function sharesToToken(
        uint256 _shares,
        uint256 _totalShares,
        uint256 _totalBalance
    ) internal pure returns (uint256) {
        uint256 tokenOfShares;

        if (_totalShares == 0 || _totalBalance == 0) {
            tokenOfShares = 0;
        } else {
            tokenOfShares = (_shares * _totalBalance) / _totalShares;
        }

        return tokenOfShares;
    }
}
