// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {AutomateReady} from "../../../AutomateReady.sol";

// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
contract Counter is AutomateReady {
    uint256 public count;
    uint256 public lastExecuted;

    constructor(address payable _automate, address _taskCreator)
        AutomateReady(_automate, _taskCreator)
    {}

    function increaseCount(uint256 amount) external onlyDedicatedMsgSender {
        count += amount;
        lastExecuted = block.timestamp;
    }
}
