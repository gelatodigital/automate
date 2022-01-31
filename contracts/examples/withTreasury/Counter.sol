// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

import {OpsReady} from "../../gelato/OpsReady.sol";

contract Counter is OpsReady {
    uint256 public count;
    uint256 public lastExecuted;
    address public immutable owner;

    // solhint-disable-next-line no-empty-blocks
    constructor(address payable _ops) OpsReady(_ops) {
        owner = msg.sender;
    }

    // solhint-disable not-rely-on-time
    function increaseCount(uint256 amount)
        external
        onlyOps
        onlyTaskCreator(owner)
    {
        require(
            ((block.timestamp - lastExecuted) > 180),
            "Counter: increaseCount: Time not elapsed"
        );

        count += amount;
        lastExecuted = block.timestamp;
    }
}
