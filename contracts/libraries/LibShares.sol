// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;
import {ETH} from "../functions/FUtils.sol";
import {IERC20Extended} from "../interfaces/IERC20Extended.sol";

library LibShares {
    function contractBalance(address _token) internal view returns (uint256) {
        if (_token == ETH) {
            return address(this).balance;
        } else {
            return IERC20Extended(_token).balanceOf(address(this));
        }
    }

    function tokenToShares(
        address _token,
        uint256 _tokenAmount,
        uint256 _totalShares,
        uint256 _totalBalance
    ) internal view returns (uint256) {
        uint256 sharesOfToken;

        uint256 tokenIn18Dp = to18Dp(_token, _tokenAmount);
        uint256 totalBalanceIn18Dp = to18Dp(_token, _totalBalance);

        // credit shares equivalent to token amount
        if (_totalShares == 0 || _totalBalance == 0) {
            sharesOfToken = tokenIn18Dp;
        } else {
            sharesOfToken = divCeil(
                tokenIn18Dp * _totalShares,
                totalBalanceIn18Dp
            );
        }

        return sharesOfToken;
    }

    function to18Dp(address _token, uint256 _amount)
        internal
        view
        returns (uint256)
    {
        if (_token == ETH) return _amount;
        uint256 decimals = IERC20Extended(_token).decimals();

        if (decimals < 18) {
            return _amount * 10**(18 - decimals);
        } else {
            return _amount / 10**(decimals - 18);
        }
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

    function divCeil(uint256 x, uint256 y) internal pure returns (uint256) {
        uint256 remainder = x % y;
        uint256 result;

        if (remainder == 0) {
            result = x / y;
        } else {
            result = ((x - remainder) + y) / y;
        }

        return result;
    }
}
