// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {LibDataTypes} from "../libraries/LibDataTypes.sol";
import {IGelato1Balance} from "./IGelato1Balance.sol";

// solhint-disable max-line-length
interface IAutomate is IGelato1Balance {
    /**
     * @notice Initiates a task with conditions which Gelato will monitor and execute when conditions are met.
     *
     * @param execAddress Address of contract that should be called by Gelato.
     * @param execData Execution data to be called with / function selector if execution data is yet to be determined.
     * @param moduleData Conditional modules that will be used. {See LibDataTypes-ModuleData}
     * @param feeToken Address of token to be used as payment. Use address(0) if Gelato 1Balance is being used, 0xeeeeee... for ETH or native tokens.
     *
     * @return taskId Unique hash of the task created.
     */
    function createTask(
        address execAddress,
        bytes calldata execData,
        LibDataTypes.ModuleData calldata moduleData,
        address feeToken
    ) external returns (bytes32 taskId);

    /**
     * @notice Terminates a task that was created and Gelato can no longer execute it.
     *
     * @param taskId Unique hash of the task that is being cancelled. {See LibTaskId-getTaskId}
     */
    function cancelTask(bytes32 taskId) external;

    /**
     * @notice Execution API called by Gelato, using Sync Fee as fee payment method
     *
     * @param taskCreator The address which created the task.
     * @param execAddress Address of contract that should be called by Gelato.
     * @param execData Execution data to be called with / function selector if execution data is yet to be determined.
     * @param moduleData Conditional modules that will be used. {See LibDataTypes-ModuleData}
     * @param txFee Fee paid to Gelato for execution, transfered to Gelato.feeCollector().
     * @param feeToken Token used to pay for the execution. ETH = 0xeeeeee...
     * @param revertOnFailure To revert or not if call to execAddress fails. (Used for off-chain simulations)
     */
    function exec(
        address taskCreator,
        address execAddress,
        bytes memory execData,
        LibDataTypes.ModuleData calldata moduleData,
        uint256 txFee,
        address feeToken,
        bool revertOnFailure
    ) external;

    /**
     * @notice Execution API called by Gelato, using Gelato 1Balance as fee payment method.
     *
     * @param taskCreator The address which created the task.
     * @param execAddress Address of contract that should be called by Gelato.
     * @param execData Execution data to be called with / function selector if execution data is yet to be determined.
     * @param moduleData Conditional modules that will be used. {See LibDataTypes-ModuleData}
     * @param oneBalanceParam Parameters required for fee payment with Gelato 1Balance.
     * @param revertOnFailure To revert or not if call to execAddress fails. (Used for off-chain simulations)
     */
    function exec1Balance(
        address taskCreator,
        address execAddress,
        bytes memory execData,
        LibDataTypes.ModuleData calldata moduleData,
        Gelato1BalanceParam calldata oneBalanceParam,
        bool revertOnFailure
    ) external;

    /**
     * @notice Execution API called by Gelato, using Gelato 1Balance as fee payment method.
     *
     * @param taskCreator The address which created the task.
     * @param execAddress Address of contract that should be called by Gelato.
     * @param taskId Unique hash of the task.
     * @param correlationId Id of the execution to be used for 1Balance settlement.
     * @param execData Execution data to be called with / function selector if execution data is yet to be determined.
     * @param revertOnFailure To revert or not if call to execAddress fails. (Used for off-chain simulations)
     * @param singleExec If the task is a SingleExec task. If true, task will be cancelled after execution.
     */
    function execBypassModule(
        address taskCreator,
        address execAddress,
        bytes32 taskId,
        bytes32 correlationId,
        bytes memory execData,
        bool revertOnFailure,
        bool singleExec
    ) external;

    /**
     * @notice Execution API called by Gelato, using Gelato Sync fee as fee payment method.
     *
     * @param taskCreator The address which created the task.
     * @param execAddress Address of contract that should be called by Gelato.
     * @param taskId Unique hash of the task.
     * @param txFee Fee paid to Gelato for execution, transfered to Gelato.feeCollector().
     * @param feeToken Token used to pay for the execution. ETH = 0xeeeeee...
     * @param execData Execution data to be called with / function selector if execution data is yet to be determined.
     * @param revertOnFailure To revert or not if call to execAddress fails. (Used for off-chain simulations)
     * @param singleExec If the task is a SingleExec task. If true, task will be cancelled after execution.
     */
    function execBypassModuleSyncFee(
        address taskCreator,
        address execAddress,
        bytes32 taskId,
        uint256 txFee,
        address feeToken,
        bytes memory execData,
        bool revertOnFailure,
        bool singleExec
    ) external;

    /**
     * @notice Sets the address of task modules. Only callable by proxy admin.
     *
     * @param modules List of modules to be set
     * @param moduleAddresses List of addresses for respective modules.
     */
    function setModule(
        LibDataTypes.Module[] calldata modules,
        address[] calldata moduleAddresses
    ) external;

    /**
     * @notice Helper function to query fee and feeToken to be used for payment. (For executions which pays itself)
     *
     * @return uint256 Fee amount to be paid.
     * @return address Token to be paid. (Determined and passed by taskCreator during createTask)
     */
    function getFeeDetails() external view returns (uint256, address);

    /**
     * @notice Helper func to query all open tasks by a task creator.
     *
     * @param taskCreator Address of task creator to query.
     *
     * @return bytes32[] List of taskIds created.
     */
    function getTaskIdsByUser(address taskCreator)
        external
        view
        returns (bytes32[] memory);

    /**
     * @notice Helper function to compute task id with module arguments
     *
     * @param taskCreator The address which created the task.
     * @param execAddress Address of contract that will be called by Gelato.
     * @param execSelector Signature of the function which will be called by Gelato.
     * @param moduleData  Conditional modules that will be used. {See LibDataTypes-ModuleData}
     * @param feeToken Address of token to be used as payment. Use address(0) if Gelato 1Balance is being used, 0xeeeeee... for ETH or native tokens.
     */
    function getTaskId(
        address taskCreator,
        address execAddress,
        bytes4 execSelector,
        LibDataTypes.ModuleData memory moduleData,
        address feeToken
    ) external pure returns (bytes32 taskId);
}
