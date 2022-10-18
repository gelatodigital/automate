// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.14;

import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {Gelatofied} from "./vendor/gelato/Gelatofied.sol";
import {GelatoBytes} from "./vendor/gelato/GelatoBytes.sol";
import {Proxied} from "./vendor/proxy/EIP173/Proxied.sol";
import {OpsStorage} from "./OpsStorage.sol";
import {LibDataTypes} from "./libraries/LibDataTypes.sol";
import {LibEvents} from "./libraries/LibEvents.sol";
import {LibLegacyTask} from "./libraries/LibLegacyTask.sol";
import {LibTaskId} from "./libraries/LibTaskId.sol";
import {LibTaskModule} from "./libraries/LibTaskModule.sol";
import {
    ITaskTreasuryUpgradable
} from "./interfaces/ITaskTreasuryUpgradable.sol";
import {IOps} from "./interfaces/IOps.sol";

/**
 * @notice Ops enables everyone to have Gelato monitor and execute transactions.
 * @notice ExecAddress refers to the contract that has the function which Gelato will call.
 * @notice Modules allow users to customise conditions and specifications when creating a task.
 */
contract Ops is Gelatofied, Proxied, OpsStorage, IOps {
    using GelatoBytes for bytes;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    // solhint-disable const-name-snakecase
    string public constant version = "5";
    ITaskTreasuryUpgradable public immutable override taskTreasury;

    constructor(address payable _gelato, ITaskTreasuryUpgradable _taskTreasury)
        Gelatofied(_gelato)
    {
        taskTreasury = _taskTreasury;
    }

    // prettier-ignore
    fallback(bytes calldata _callData) external returns(bytes memory returnData){
        returnData = _handleLegacyTaskCreation(_callData);
    }

    ///@inheritdoc IOps
    function createTask(
        address _execAddress,
        bytes calldata _execDataOrSelector,
        LibDataTypes.ModuleData calldata _moduleData,
        address _feeToken
    ) external override returns (bytes32 taskId) {
        address taskCreator;

        (taskCreator, _execAddress) = LibTaskModule.preCreateTask(
            msg.sender,
            _execAddress,
            taskModuleAddresses
        );

        taskId = _createTask(
            taskCreator,
            _execAddress,
            _execDataOrSelector,
            _moduleData,
            _feeToken
        );
    }

    ///@inheritdoc IOps
    function cancelTask(bytes32 _taskId) external {
        address _taskCreator = LibTaskModule.preCancelTask(
            _taskId,
            msg.sender,
            taskModuleAddresses
        );

        _cancelTask(_taskCreator, _taskId);
    }

    ///@inheritdoc IOps
    function exec(
        address _taskCreator,
        address _execAddress,
        bytes memory _execData,
        LibDataTypes.ModuleData calldata _moduleData,
        uint256 _txFee,
        address _feeToken,
        bool _useTaskTreasuryFunds,
        bool _revertOnFailure
    ) external onlyGelato {
        bytes32 taskId = LibTaskId.getTaskId(
            _taskCreator,
            _execAddress,
            _execData.memorySliceSelector(),
            _moduleData,
            _useTaskTreasuryFunds ? address(0) : _feeToken
        );

        _exec(
            taskId,
            _taskCreator,
            _execAddress,
            _execData,
            _moduleData.modules,
            _txFee,
            _feeToken,
            _useTaskTreasuryFunds,
            _revertOnFailure
        );
    }

    ///@inheritdoc IOps
    function setModule(
        LibDataTypes.Module[] calldata _modules,
        address[] calldata _moduleAddresses
    ) external onlyProxyAdmin {
        uint256 length = _modules.length;
        for (uint256 i; i < length; i++) {
            taskModuleAddresses[_modules[i]] = _moduleAddresses[i];
        }
    }

    ///@inheritdoc IOps
    function getFeeDetails() external view returns (uint256, address) {
        return (fee, feeToken);
    }

    ///@inheritdoc IOps
    function getTaskIdsByUser(address _taskCreator)
        external
        view
        returns (bytes32[] memory)
    {
        bytes32[] memory taskIds = _createdTasks[_taskCreator].values();

        return taskIds;
    }

    ///@inheritdoc IOps
    function getTaskId(
        address taskCreator,
        address execAddress,
        bytes4 execSelector,
        LibDataTypes.ModuleData memory moduleData,
        address feeToken
    ) external pure returns (bytes32 taskId) {
        taskId = LibTaskId.getTaskId(
            taskCreator,
            execAddress,
            execSelector,
            moduleData,
            feeToken
        );
    }

    ///@inheritdoc IOps
    function getTaskId(
        address taskCreator,
        address execAddress,
        bytes4 execSelector,
        bool useTaskTreasuryFunds,
        address feeToken,
        bytes32 resolverHash
    ) external pure returns (bytes32 taskId) {
        taskId = LibTaskId.getLegacyTaskId(
            taskCreator,
            execAddress,
            execSelector,
            useTaskTreasuryFunds,
            feeToken,
            resolverHash
        );
    }

    function _createTask(
        address _taskCreator,
        address _execAddress,
        bytes memory _execDataOrSelector,
        LibDataTypes.ModuleData memory _moduleData,
        address _feeToken
    ) private returns (bytes32 taskId) {
        taskId = LibTaskId.getTaskId(
            _taskCreator,
            _execAddress,
            _execDataOrSelector.memorySliceSelector(),
            _moduleData,
            _feeToken
        );

        require(
            !_createdTasks[_taskCreator].contains(taskId),
            "Ops.createTask: Duplicate task"
        );

        LibTaskModule.onCreateTask(
            taskId,
            _taskCreator,
            _execAddress,
            _execDataOrSelector,
            _moduleData,
            taskModuleAddresses
        );

        _createdTasks[_taskCreator].add(taskId);

        emit LibEvents.TaskCreated(
            _taskCreator,
            _execAddress,
            _execDataOrSelector,
            _moduleData,
            _feeToken,
            taskId
        );
    }

    function _cancelTask(address _taskCreator, bytes32 _taskId) private {
        require(
            _createdTasks[_taskCreator].contains(_taskId),
            "Ops.cancelTask: Task not found"
        );

        _createdTasks[_taskCreator].remove(_taskId);

        emit LibEvents.TaskCancelled(_taskId, _taskCreator);
    }

    // solhint-disable function-max-lines
    function _exec(
        bytes32 _taskId,
        address _taskCreator,
        address _execAddress,
        bytes memory _execData,
        LibDataTypes.Module[] memory _modules,
        uint256 _txFee,
        address _feeToken,
        bool _useTaskTreasuryFunds,
        bool _revertOnFailure
    ) private {
        require(
            _createdTasks[_taskCreator].contains(_taskId),
            "Ops.exec: Task not found"
        );

        if (!_useTaskTreasuryFunds) {
            fee = _txFee;
            feeToken = _feeToken;
        }

        bool success = LibTaskModule.onExecTask(
            _taskId,
            _taskCreator,
            _execAddress,
            _execData,
            _modules,
            _revertOnFailure,
            taskModuleAddresses
        );

        if (_useTaskTreasuryFunds) {
            taskTreasury.useFunds(_taskCreator, _feeToken, _txFee);
        } else {
            delete fee;
            delete feeToken;
        }

        emit LibEvents.ExecSuccess(
            _txFee,
            _feeToken,
            _execAddress,
            _execData,
            _taskId,
            success
        );
    }

    function _handleLegacyTaskCreation(bytes calldata _callData)
        private
        returns (bytes memory returnData)
    {
        bytes4 funcSig = _callData.calldataSliceSelector();

        (
            address execAddress,
            bytes memory execData,
            LibDataTypes.ModuleData memory moduleData,
            address feeToken_
        ) = LibLegacyTask.getCreateTaskArg(funcSig, _callData);

        bytes32 taskId = _createTask(
            msg.sender,
            execAddress,
            execData,
            moduleData,
            feeToken_
        );

        returnData = abi.encodePacked(taskId);
    }
}
