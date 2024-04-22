// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.14;

import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {Gelatofied} from "./vendor/gelato/Gelatofied.sol";
import {GelatoBytes} from "./vendor/gelato/GelatoBytes.sol";
import {Proxied} from "./vendor/proxy/EIP173/Proxied.sol";
import {AutomateStorage} from "./AutomateStorage.sol";
import {LibDataTypes} from "./libraries/LibDataTypes.sol";
import {LibEvents} from "./libraries/LibEvents.sol";
import {LibTaskId} from "./libraries/LibTaskId.sol";
import {LibTaskModule} from "./libraries/LibTaskModule.sol";
import {LibBypassModule} from "./libraries/LibBypassModule.sol";
import {IAutomate} from "./interfaces/IAutomate.sol";

/**
 * @notice Automate enables everyone to have Gelato monitor and execute transactions.
 * @notice ExecAddress refers to the contract that has the function which Gelato will call.
 * @notice Modules allow users to customise conditions and specifications when creating a task.
 */
//solhint-disable function-max-lines
//solhint-disable no-empty-blocks
contract Automate is Gelatofied, Proxied, AutomateStorage, IAutomate {
    using GelatoBytes for bytes;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    // solhint-disable const-name-snakecase
    string public constant version = "7";

    constructor(address payable _gelato) Gelatofied(_gelato) {}

    ///@inheritdoc IAutomate
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

    ///@inheritdoc IAutomate
    function cancelTask(bytes32 _taskId) external {
        address _taskCreator = LibTaskModule.preCancelTask(
            _taskId,
            msg.sender,
            taskModuleAddresses
        );

        _cancelTask(_taskCreator, _taskId);
    }

    ///@inheritdoc IAutomate
    function exec(
        address _taskCreator,
        address _execAddress,
        bytes memory _execData,
        LibDataTypes.ModuleData calldata _moduleData,
        uint256 _txFee,
        address _feeToken,
        bool _revertOnFailure
    ) external onlyGelato {
        bytes32 taskId = LibTaskId.getTaskId(
            _taskCreator,
            _execAddress,
            _execData.memorySliceSelector(),
            _moduleData,
            _feeToken
        );

        require(
            _createdTasks[_taskCreator].contains(taskId),
            "Automate.exec: Task not found"
        );

        fee = _txFee;
        feeToken = _feeToken;

        bool success = LibTaskModule.onExecTask(
            taskId,
            _taskCreator,
            _execAddress,
            _execData,
            _moduleData.modules,
            _revertOnFailure,
            taskModuleAddresses
        );

        delete fee;
        delete feeToken;

        emit LibEvents.ExecSuccess(
            _txFee,
            _feeToken,
            _execAddress,
            _execData,
            taskId,
            success
        );
    }

    ///@inheritdoc IAutomate
    function exec1Balance(
        address _taskCreator,
        address _execAddress,
        bytes memory _execData,
        LibDataTypes.ModuleData calldata _moduleData,
        Gelato1BalanceParam calldata _oneBalanceParam,
        bool _revertOnFailure
    ) external onlyGelato {
        bytes32 taskId = LibTaskId.getTaskId(
            _taskCreator,
            _execAddress,
            _execData.memorySliceSelector(),
            _moduleData,
            address(0)
        );

        require(
            _createdTasks[_taskCreator].contains(taskId),
            "Automate.exec: Task not found"
        );

        bool success = LibTaskModule.onExecTask(
            taskId,
            _taskCreator,
            _execAddress,
            _execData,
            _moduleData.modules,
            _revertOnFailure,
            taskModuleAddresses
        );

        emit LibEvents.ExecSuccess(
            0,
            address(0),
            _execAddress,
            _execData,
            taskId,
            success
        );

        emit LogUseGelato1Balance(
            _oneBalanceParam.sponsor,
            _execAddress,
            _oneBalanceParam.feeToken,
            _oneBalanceParam.oneBalanceChainId,
            _oneBalanceParam.nativeToFeeTokenXRateNumerator,
            _oneBalanceParam.nativeToFeeTokenXRateDenominator,
            _oneBalanceParam.correlationId
        );
    }

    function execBypassModuleSyncFee(
        address _taskCreator,
        address _execAddress,
        bytes32 _taskId,
        uint256 _txFee,
        address _feeToken,
        bytes memory _execData,
        bool _revertOnFailure,
        bool _singleExec
    ) external onlyGelato {
        require(
            _createdTasks[_taskCreator].contains(_taskId),
            "Automate.exec: Task not found"
        );

        fee = _txFee;
        feeToken = _feeToken;

        bool success = LibBypassModule.onExecTask(
            _taskId,
            _taskCreator,
            _execAddress,
            _execData,
            _revertOnFailure,
            _singleExec,
            _createdTasks
        );

        delete fee;
        delete feeToken;

        emit LibEvents.ExecBypassModuleSyncFeeSuccess(
            _taskId,
            _txFee,
            _feeToken,
            success
        );
    }

    ///@inheritdoc IAutomate
    function execBypassModule(
        address _taskCreator,
        address _execAddress,
        bytes32 _taskId,
        bytes32 _correlationId,
        bytes memory _execData,
        bool _revertOnFailure,
        bool _singleExec
    ) external onlyGelato {
        require(
            _createdTasks[_taskCreator].contains(_taskId),
            "Automate.exec: Task not found"
        );

        bool success = LibBypassModule.onExecTask(
            _taskId,
            _taskCreator,
            _execAddress,
            _execData,
            _revertOnFailure,
            _singleExec,
            _createdTasks
        );

        emit LibEvents.ExecBypassModuleSuccess(
            _taskId,
            _correlationId,
            success
        );
    }

    ///@inheritdoc IAutomate
    function setModule(
        LibDataTypes.Module[] calldata _modules,
        address[] calldata _moduleAddresses
    ) external onlyProxyAdmin {
        uint256 length = _modules.length;
        for (uint256 i; i < length; i++) {
            taskModuleAddresses[_modules[i]] = _moduleAddresses[i];
        }
    }

    ///@inheritdoc IAutomate
    function getFeeDetails() external view returns (uint256, address) {
        return (fee, feeToken);
    }

    ///@inheritdoc IAutomate
    function getTaskIdsByUser(address _taskCreator)
        external
        view
        returns (bytes32[] memory)
    {
        bytes32[] memory taskIds = _createdTasks[_taskCreator].values();

        return taskIds;
    }

    ///@inheritdoc IAutomate
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
            "Automate.createTask: Duplicate task"
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
            "Automate.cancelTask: Task not found"
        );

        _createdTasks[_taskCreator].remove(_taskId);

        emit LibEvents.TaskCancelled(_taskId, _taskCreator);
    }
}
