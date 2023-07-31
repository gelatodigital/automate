// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import {LibDataTypes} from "./LibDataTypes.sol";

library LibEvents {
    /**
     * @notice Emitted when `createTask` is called.
     *
     * @param taskCreator The address which created the task.
     * @param execAddress Address of contract that is called by Gelato.
     * @param execDataOrSelector Execution data / function selector.
     * @param moduleData Conditional modules used. {See LibDataTypes-ModuleData}
     * @param feeToken Token used to pay for the execution. ETH = 0xeeeeee...
     * @param taskId Unique hash of the task. {See LibTaskId-getTaskId}
     */
    event TaskCreated(
        address indexed taskCreator,
        address indexed execAddress,
        bytes execDataOrSelector,
        LibDataTypes.ModuleData moduleData,
        address feeToken,
        bytes32 indexed taskId
    );

    /**
     * @notice Emitted when `cancelTask` is called.
     *
     * @param taskId Unique hash of the task. {See LibTaskId-getTaskId}
     * @param taskCreator The address which owned the task.
     */
    event TaskCancelled(bytes32 taskId, address taskCreator);

    /**
     * @notice Emitted when `exec` is called.
     *
     * @param txFee Fee paid to Gelato for execution
     * @param feeToken Token used to pay for the execution. ETH = 0xeeeeee...
     * @param execAddress Address of contract that will be called by Gelato.
     * @param execData Execution data / function selector.
     * @param taskId Unique hash of the task. {See LibTaskId-getTaskId}
     * @param callSuccess Status of the call to execAddress.
     */
    event ExecSuccess(
        uint256 indexed txFee,
        address indexed feeToken,
        address indexed execAddress,
        bytes execData,
        bytes32 taskId,
        bool callSuccess
    );

    /**
     * @notice Emitted when TimeModule is initialised.
     *
     * @param taskId Unique hash of the task. {See LibTaskId-getTaskId}
     * @param nextExec Time when the next execution will occur.
     * @param interval Time interval between each execution.
     */
    event TimerSet(
        bytes32 indexed taskId,
        uint128 indexed nextExec,
        uint128 indexed interval
    );
}
