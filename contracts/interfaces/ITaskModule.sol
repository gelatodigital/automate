// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

// solhint-disable max-line-length
interface ITaskModule {
    /**
     * @notice Initiates task module whenever `createTask` is being called.
     *
     * @param taskId Unique hash of the task created.
     * @param taskCreator The address which created the task.
     * @param execAddress Address of contract that should be called.
     * @param execData Execution data to be called with / function selector if execution data is yet to be determined.
     * @param initModuleArg Encoded arguments for module if any.
     */
    function onCreateTask(
        bytes32 taskId,
        address taskCreator,
        address execAddress,
        bytes calldata execData,
        bytes calldata initModuleArg
    ) external;

    /**
     * @notice Called during `exec` and before execAddress is being called.
     *
     * @param taskId Unique hash of the task created.
     * @param taskCreator The address which created the task.
     * @param execAddress Address of contract that should be called.
     * @param execData Execution data to be called with / function selector if execution data is yet to be determined.
     *
     * @return address Overriden or original execution address
     * @return bytes Overriden or original execution data
     */
    function preExecTask(
        bytes32 taskId,
        address taskCreator,
        address execAddress,
        bytes calldata execData
    ) external returns (address, bytes memory);

    /**
     * @notice Called during `exec` and after execAddress is called.
     *
     * @param taskId Unique hash of the task created.
     * @param taskCreator The address which created the task.
     * @param execAddress Address of contract that should be called.
     * @param execData Execution data to be called with / function selector if execution data is yet to be determined.
     */
    function postExecTask(
        bytes32 taskId,
        address taskCreator,
        address execAddress,
        bytes calldata execData
    ) external;
}
