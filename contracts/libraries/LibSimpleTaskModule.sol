// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import {_call, _delegateCall} from "../functions/FExec.sol";
import {LibDataTypes} from "./LibDataTypes.sol";
import {LibTaskModule} from "./LibTaskModule.sol";
import {LibTaskModuleConfig} from "./LibTaskModuleConfig.sol";
import {ITaskModule} from "../interfaces/ITaskModule.sol";

// solhint-disable function-max-lines
/// @notice Library to call task modules on task creation and execution.
library LibSimpleTaskModule {
    using LibTaskModuleConfig for LibDataTypes.Module;

    /**
     * @notice Delegate calls task modules on exec.
     *
     * @param _taskId Unique hash of the task. {See LibTaskId-getTaskId}
     * @param _taskCreator Address which created the task.
     * @param _execAddress Address of contract that will be called by Gelato.
     * @param _execData Execution data to be called with / function selector.
     * @param _revertOnFailure To revert or not if call to execAddress fails.
     * @param _singleExec If task is a single exec task.
     * @param taskModuleAddresses The storage reference to the mapping of modules to their address.
     */
    function onExecTask(
        bytes32 _taskId,
        address _taskCreator,
        address _execAddress,
        bytes memory _execData,
        bool _revertOnFailure,
        bool _singleExec,
        mapping(LibDataTypes.Module => address) storage taskModuleAddresses
    ) internal returns (bool callSuccess) {
        (callSuccess, ) = _call(
            _execAddress,
            abi.encodePacked(_execData, _taskCreator),
            0,
            _revertOnFailure,
            "Automate.exec: "
        );

        if (_singleExec) {
            LibDataTypes.Module[] memory modules = new LibDataTypes.Module[](1);
            address[] memory moduleAddresses = new address[](1);

            modules[0] = LibDataTypes.Module.SINGLE_EXEC;
            moduleAddresses[0] = taskModuleAddresses[
                LibDataTypes.Module.SINGLE_EXEC
            ];

            LibTaskModule.postExecCall(
                _taskId,
                _taskCreator,
                _execAddress,
                _execData,
                modules,
                moduleAddresses
            );
        }
    }
}
