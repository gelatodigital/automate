// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

import {OpsReady} from "../gelato/OpsReady.sol";

contract CounterTimedTask is OpsReady {
    uint256 public count;
    bool public executable;

    // solhint-disable-next-line no-empty-blocks
    constructor(address payable _ops) OpsReady(_ops) {}

    // solhint-disable not-rely-on-time
    function increaseCount(uint256 amount) external onlyOps {
        require(executable, "CounterTimedTask: increaseCount: Not executable");

        count += amount;
    }

    function setExecutable(bool _executable) external {
        executable = _executable;
    }
}
