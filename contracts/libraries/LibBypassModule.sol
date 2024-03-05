// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {_call, _delegateCall} from "../functions/FExec.sol";
import {LibDataTypes} from "./LibDataTypes.sol";
import {LibEvents} from "./LibEvents.sol";
import {LibTaskModule} from "./LibTaskModule.sol";
import {LibTaskModuleConfig} from "./LibTaskModuleConfig.sol";
import {ITaskModule} from "../interfaces/ITaskModule.sol";

// solhint-disable function-max-lines
/// @notice Simplified library for task executions
library LibBypassModule {
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using LibTaskModuleConfig for LibDataTypes.Module;

    /**
     * @notice Delegate calls SingleExecModule on exec for single exec tasks.
     *
     * @param _taskId Unique hash of the task. {See LibTaskId-getTaskId}
     * @param _taskCreator Address which created the task.
     * @param _execAddress Address of contract that will be called by Gelato.
     * @param _execData Execution data to be called with / function selector.
     * @param _revertOnFailure To revert or not if call to execAddress fails.
     * @param _singleExec If task is a single exec task.
     * @param _createdTasks The storage reference of owner to the taskIds created mapping.
     */
    function onExecTask(
        bytes32 _taskId,
        address _taskCreator,
        address _execAddress,
        bytes memory _execData,
        bool _revertOnFailure,
        bool _singleExec,
        mapping(address => EnumerableSet.Bytes32Set) storage _createdTasks
    ) internal returns (bool callSuccess) {
        (callSuccess, ) = _call(
            _execAddress,
            abi.encodePacked(_execData, _taskCreator),
            0,
            _revertOnFailure,
            "Automate.exec: "
        );

        if (_singleExec) {
            _createdTasks[_taskCreator].remove(_taskId);
            emit LibEvents.TaskCancelled(_taskId, _taskCreator);
        }
    }
}
