// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {OpsReady} from "../../../OpsReady.sol";

// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
contract CounterWT is OpsReady {
    uint256 public count;
    uint256 public lastExecuted;

    constructor(address _ops, address _taskCreator)
        OpsReady(_ops, _taskCreator)
    {}

    receive() external payable {}

    function increaseCount(uint256 amount) external onlyDedicatedMsgSender {
        count += amount;
        lastExecuted = block.timestamp;

        (uint256 fee, address feeToken) = _getFeeDetails();

        _transfer(fee, feeToken);
    }
}
