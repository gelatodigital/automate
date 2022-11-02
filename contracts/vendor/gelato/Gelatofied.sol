// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {
    SafeERC20,
    IERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {_transfer, ETH} from "../../functions/FUtils.sol";

abstract contract Gelatofied {
    address payable public immutable gelato;

    modifier gelatofy(uint256 _amount, address _paymentToken) {
        require(msg.sender == gelato, "Gelatofied: Only gelato");
        _;
        _transfer(gelato, _paymentToken, _amount);
    }

    modifier onlyGelato() {
        require(msg.sender == gelato, "Gelatofied: Only gelato");
        _;
    }

    constructor(address payable _gelato) {
        gelato = _gelato;
    }
}
