// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ITaskTreasuryUpgradable} from "./ITaskTreasuryUpgradable.sol";

/**
 * @notice Legacy Ops interface with individual create task function for each task type.
 * @notice These function signatures are still supported via fallback. {See Ops.sol-fallback}
 */
interface ILegacyOps {
    function createTask(
        address _execAddress,
        bytes4 _execSelector,
        address _resolverAddress,
        bytes calldata _resolverData
    ) external returns (bytes32 taskId);

    function createTaskNoPrepayment(
        address _execAddress,
        bytes4 _execSelector,
        address _resolverAddress,
        bytes calldata _resolverData,
        address _feeToken
    ) external returns (bytes32 taskId);

    function createTimedTask(
        uint128 _startTime,
        uint128 _interval,
        address _execAddress,
        bytes4 _execSelector,
        address _resolverAddress,
        bytes calldata _resolverData,
        address _feeToken,
        bool _useTreasury
    ) external returns (bytes32 taskId);

    function cancelTask(bytes32 _taskId) external;

    function exec(
        uint256 _txFee,
        address _feeToken,
        address _taskCreator,
        bool _useTaskTreasuryFunds,
        bool _revertOnFailure,
        bytes32 _resolverHash,
        address _execAddress,
        bytes calldata _execData
    ) external;

    function getFeeDetails() external view returns (uint256, address);

    function getTaskIdsByUser(address _taskCreator)
        external
        view
        returns (bytes32[] memory);

    function taskTreasury() external view returns (ITaskTreasuryUpgradable);
}
