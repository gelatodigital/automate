// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.12;

import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {Gelatofied} from "./vendor/gelato/Gelatofied.sol";
import {GelatoBytes} from "./vendor/gelato/GelatoBytes.sol";
import {LibOps} from "./libraries/LibOps.sol";
import {LibLegacyTask} from "./libraries/LibLegacyTask.sol";
import {IOps} from "./interfaces/IOps.sol";
import {DataTypes} from "./libraries/DataTypes.sol";
import {Events} from "./libraries/Events.sol";
import {TaskModules} from "./taskModules/TaskModules.sol";
import {OpsProxied} from "./vendor/proxy/opsProxy/OpsProxied.sol";

// solhint-disable max-line-length
// solhint-disable not-rely-on-time
/// @notice Ops enables everyone to communicate to Gelato Bots to monitor and execute certain transactions
/// @notice ResolverAddresses determine when Gelato should execute and provides bots with
/// the payload they should use to execute
/// @notice ExecAddress determine the actual contracts to execute a function on
contract Ops is Gelatofied, LibOps, TaskModules, OpsProxied, IOps {
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using GelatoBytes for bytes;

    constructor(
        address payable _gelato,
        address _taskTreasury,
        address _opsProxyFactory
    ) Gelatofied(_gelato) TaskModules(_taskTreasury, _opsProxyFactory) {}

    // prettier-ignore
    fallback(bytes calldata _callData) external returns(bytes memory returnData){
        bytes4 funcSig = _callData.calldataSliceSelector();
        returnData = _handleLegacyTaskCreations(funcSig, _callData);
    }

    function createTask(
        address _execAddress,
        bytes4 _execSelector,
        address _resolverAddress,
        bytes calldata _resolverData,
        address _feeToken,
        DataTypes.Modules[] calldata _taskModules,
        bytes[] calldata _taskModuleArgs
    ) external returns (bytes32 taskId) {
        taskId = _createTask(
            msg.sender,
            _execAddress,
            _execSelector,
            _resolverAddress,
            _resolverData,
            _feeToken,
            _taskModules,
            _taskModuleArgs
        );
    }

    function cancelTask(bytes32 _taskId) external override {
        address creator = taskCreator[_taskId];

        require(
            creator == msg.sender ||
                (opsProxyFactory.isProxy(msg.sender) &&
                    creator == opsProxyFactory.getOwnerOf(msg.sender)),
            "Ops: cancelTask: Sender did not start task yet"
        );

        _createdTasks[creator].remove(_taskId);
        delete taskCreator[_taskId];
        delete execAddresses[_taskId];

        _handleTaskModuleOnCancel(_taskId);

        emit Events.TaskCancelled(_taskId, creator);
    }

    // solhint-disable function-max-lines
    // solhint-disable code-complexity
    function exec(
        uint256 _txFee,
        address _feeToken,
        address _taskCreator,
        bool _useTaskTreasuryFunds,
        bool _revertOnFailure,
        bytes32 _resolverHash,
        address _execAddress,
        bytes calldata _execData
    ) external override onlyGelato {
        bytes32 taskId = getTaskId(
            _taskCreator,
            _execAddress,
            _execData.calldataSliceSelector(),
            _useTaskTreasuryFunds,
            _useTaskTreasuryFunds ? address(0) : _feeToken,
            _resolverHash
        );

        require(
            _taskCreator != address(0) && taskCreator[taskId] == _taskCreator,
            "Ops: exec: No task found"
        );

        if (!_useTaskTreasuryFunds) {
            fee = _txFee;
            feeToken = _feeToken;
        }

        (bool success, bytes memory returnData) = _execAddress.call(_execData);

        _handleTaskModuleOnExec(taskId, _taskCreator);

        // For off-chain simultaion
        if (!success && _revertOnFailure)
            returnData.revertWithError("Ops.exec:");

        if (_useTaskTreasuryFunds) {
            taskTreasury.useFunds(_taskCreator, _feeToken, _txFee);
        } else {
            delete fee;
            delete feeToken;
        }

        emit Events.ExecSuccess(
            _txFee,
            _feeToken,
            _execAddress,
            _execData,
            taskId,
            success
        );
    }

    function getFeeDetails() external view override returns (uint256, address) {
        return (fee, feeToken);
    }

    function getTaskIdsByUser(address _taskCreator)
        external
        view
        override
        returns (bytes32[] memory)
    {
        uint256 length = _createdTasks[_taskCreator].length();
        bytes32[] memory taskIds = new bytes32[](length);

        for (uint256 i; i < length; i++) {
            taskIds[i] = _createdTasks[_taskCreator].at(i);
        }

        return taskIds;
    }

    function _createTask(
        address _taskCreator,
        address _execAddress,
        bytes4 _execSelector,
        address _resolverAddress,
        bytes memory _resolverData,
        address _feeToken,
        DataTypes.Modules[] memory _taskModules,
        bytes[] memory _taskModuleArgs
    ) private returns (bytes32 taskId) {
        _taskCreator = _checkForOpsProxyAndGetTaskCreator(
            opsProxyFactory,
            _execAddress,
            _taskCreator
        );

        bool useTaskTreasuryFunds = _feeToken == address(0);
        bytes32 resolverHash = getResolverHash(_resolverAddress, _resolverData);

        taskId = getTaskId(
            _taskCreator,
            _execAddress,
            _execSelector,
            useTaskTreasuryFunds,
            _feeToken,
            resolverHash
        );

        require(
            taskCreator[taskId] == address(0),
            "Ops: _createTask: Sender already started task"
        );

        _handleTaskModuleOnCreate(taskId, _taskModules, _taskModuleArgs);

        _createdTasks[_taskCreator].add(taskId);
        taskCreator[taskId] = _taskCreator;
        execAddresses[taskId] = _execAddress;

        emit Events.TaskCreated(
            _taskCreator,
            _execAddress,
            _execSelector,
            _resolverAddress,
            taskId,
            _resolverData,
            useTaskTreasuryFunds,
            _feeToken,
            resolverHash
        );
    }

    function _handleLegacyTaskCreations(
        bytes4 _createTaskFuncSig,
        bytes calldata _callData
    ) private returns (bytes memory returnData) {
        (
            address execAddress,
            bytes4 execSelector,
            address resolverAddress,
            bytes memory resolverData,
            address feeToken,
            DataTypes.Modules[] memory taskModules,
            bytes[] memory taskModuleArgs
        ) = LibLegacyTask.getLegacyCreateTaskArgs(
                _createTaskFuncSig,
                _callData
            );

        bytes32 taskId = _createTask(
            msg.sender,
            execAddress,
            execSelector,
            resolverAddress,
            resolverData,
            feeToken,
            taskModules,
            taskModuleArgs
        );

        returnData = abi.encodePacked(taskId);
    }
}
