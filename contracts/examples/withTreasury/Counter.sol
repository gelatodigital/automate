// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {OpsReady} from "../../vendor/gelato/OpsReady.sol";

contract Counter is OpsReady {
    uint256 public count;
    uint256 public lastExecuted;

    // solhint-disable-next-line no-empty-blocks
    constructor(address payable _ops) OpsReady(_ops) {}

    // solhint-disable not-rely-on-time
    function increaseCount(uint256 amount) external onlyOps {
        require(
            ((block.timestamp - lastExecuted) > 180),
            "Counter: increaseCount: Time not elapsed"
        );

        count += amount;
        lastExecuted = block.timestamp;
    }
}
