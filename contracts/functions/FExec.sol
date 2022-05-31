// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import {GelatoBytes} from "../vendor/gelato/GelatoBytes.sol";

// solhint-disable private-vars-leading-underscore
// solhint-disable func-visibility

function _call(
    address _add,
    bytes memory _data,
    bool _revertOnFailure,
    string memory _tracingInfo
) returns (bool success, bytes memory returnData) {
    (success, returnData) = _add.call(_data);

    if (!success && _revertOnFailure)
        GelatoBytes.revertWithError(returnData, _tracingInfo);
}

function _delegateCall(
    address _add,
    bytes memory _data,
    string memory _tracingInfo
) returns (bool success, bytes memory returnData) {
    (success, returnData) = _add.delegatecall(_data);

    if (!success) GelatoBytes.revertWithError(returnData, _tracingInfo);
}
