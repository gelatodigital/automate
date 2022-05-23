// // SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {DataTypes} from "../libraries/DataTypes.sol";
import {OpsStorage} from "../OpsStorage.sol";
import {TimeModule} from "./TimeModule.sol";
import {SingleExecModule} from "./SingleExecModule.sol";

contract TaskModules is TimeModule, SingleExecModule, OpsStorage {
    constructor(address _taskTreasury, address _opsProxyFactory)
        OpsStorage(_taskTreasury, _opsProxyFactory)
    {}

    function _handleTaskModuleOnCreate(
        bytes32 _taskId,
        DataTypes.Modules[] memory _taskModules,
        bytes[] memory _taskModuleArgs
    ) internal {
        uint256 length = _taskModules.length;
        for (uint256 i; i < length; i++) {
            if (_taskModules[i] == DataTypes.Modules.SINGLE) {
                _singleExecOnCreate(
                    _taskId,
                    _taskModuleArgs[i],
                    singleExecTask
                );
            }
            if (_taskModules[i] == DataTypes.Modules.TIME) {
                _startTime(_taskId, _taskModuleArgs[i], timedTask);
            }
        }
    }

    function _handleTaskModuleOnCancel(bytes32 _taskId) internal {
        _deleteTime(_taskId, timedTask);
        _singleExecOnCancel(_taskId, singleExecTask);
    }

    function _handleTaskModuleOnExec(bytes32 _taskId, address _taskCreator)
        internal
    {
        _updateTime(_taskId, timedTask);
        _singleExecOnExec(
            _taskId,
            _taskCreator,
            singleExecTask,
            taskCreator,
            execAddresses,
            _createdTasks
        );
    }
}
