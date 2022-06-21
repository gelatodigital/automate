// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {OpsReady} from "../vendor/gelato/OpsReady.sol";

interface IOps {
    function getFeeDetails() external view returns (uint256, address);
}

// solhint-disable no-empty-blocks
contract OpsTest is OpsReady {
    uint256 public count;

    constructor(address _ops) OpsReady(_ops) {}

    receive() external payable {}

    function increaseCount(uint256 _count) external {
        count += _count;
    }

    function increaseCountNoPrepayment(uint256 _count) external {
        count += _count;

        uint256 fee;
        address feeToken;

        (fee, feeToken) = IOps(ops).getFeeDetails();

        _transfer(fee, feeToken);
    }

    function checker(uint256 _count)
        external
        pure
        returns (bool canExec, bytes memory payload)
    {
        canExec = true;
        payload = abi.encodeWithSelector(this.increaseCount.selector, _count);
    }
}
