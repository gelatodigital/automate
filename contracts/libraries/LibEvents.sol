// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import {LibDataTypes} from "./LibDataTypes.sol";

library LibEvents {
    event TaskCancelled(bytes32 taskId, address taskCreator);

    event ExecSuccess(
        uint256 indexed txFee,
        address indexed feeToken,
        address indexed execAddress,
        bytes execData,
        bytes32 taskId,
        bool callSuccess
    );

    event TaskCreated(
        address indexed taskCreator,
        address indexed execAddress,
        bytes execData,
        LibDataTypes.ModuleData moduleData,
        address feeToken,
        bytes32 indexed taskId
    );

    event TimerSet(
        bytes32 indexed taskId,
        uint128 indexed nextExec,
        uint128 indexed interval
    );
}
