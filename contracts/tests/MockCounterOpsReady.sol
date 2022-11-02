// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {MockOpsReady} from "./MockOpsReady.sol";

// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
contract MockCounterOpsReady is MockOpsReady {
    uint256 public count;
    uint256 public lastExecuted;

    constructor(
        address payable _ops,
        address _opsProxyFactory,
        address _taskCreator
    ) MockOpsReady(_ops, _opsProxyFactory, _taskCreator) {}

    function increaseCount(uint256 amount) external onlyDedicatedMsgSender {
        require(
            ((block.timestamp - lastExecuted) > 180),
            "Counter: increaseCount: Time not elapsed"
        );

        count += amount;
        lastExecuted = block.timestamp;
    }
}
