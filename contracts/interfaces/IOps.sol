// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {ITaskTreasuryUpgradable} from "./ITaskTreasuryUpgradable.sol";
import {
    IOpsProxyFactory
} from "../vendor/proxy/opsProxy/interfaces/IOpsProxyFactory.sol";

interface IOps {
    /// @notice Structs ///

    struct Time {
        uint128 nextExec;
        uint128 interval;
    }

    /// @notice Events ///

    event ExecSuccess(
        uint256 indexed txFee,
        address indexed feeToken,
        address indexed execAddress,
        bytes execData,
        bytes32 taskId,
        bool callSuccess
    );

    event TaskCreated(
        address taskCreator,
        address execAddress,
        bytes4 selector,
        address resolverAddress,
        bytes32 taskId,
        bytes resolverData,
        bool useTaskTreasuryFunds,
        address feeToken,
        bytes32 resolverHash
    );

    event TaskCancelled(bytes32 taskId, address taskCreator);

    event TimerSet(
        bytes32 indexed taskId,
        uint128 indexed nextExec,
        uint128 indexed interval
    );

    /// @notice External functions ///

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
        address _feeToken
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

    /// @notice External view functions ///

    function getFeeDetails() external view returns (uint256, address);

    function getTaskIdsByUser(address _taskCreator)
        external
        view
        returns (bytes32[] memory);

    function opsProxyFactory() external view returns (IOpsProxyFactory);

    function taskTreasury() external view returns (ITaskTreasuryUpgradable);
}
