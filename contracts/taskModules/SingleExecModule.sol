// // SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {DataTypes} from "../libraries/DataTypes.sol";
import {Events} from "../libraries/Events.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract SingleExecModule {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    function _singleExecOnCreate(
        bytes32 _taskId,
        bytes memory _singleExecArgs,
        mapping(bytes32 => DataTypes.SingleExec) storage singleExecTask
    ) internal {
        DataTypes.SingleExec memory singleExec = _decodeSingleExecArgs(
            _singleExecArgs
        );
        singleExecTask[_taskId] = singleExec;
    }

    function _singleExecOnExec(
        bytes32 _taskId,
        address _taskCreator,
        mapping(bytes32 => DataTypes.SingleExec) storage singleExecTask,
        mapping(bytes32 => address) storage taskCreator,
        mapping(bytes32 => address) storage execAddresses,
        mapping(address => EnumerableSet.Bytes32Set) storage _createdTasks
    ) internal {
        DataTypes.SingleExec memory singleExec = singleExecTask[_taskId];
        if (singleExec.enabled) {
            require(
                block.timestamp >= singleExec.execTime,
                "Ops: SingleExec: Time not elapsed"
            );
            delete singleExecTask[_taskId];
            delete taskCreator[_taskId];
            delete execAddresses[_taskId];
            _createdTasks[_taskCreator].remove(_taskId);

            emit Events.TaskCancelled(_taskId, _taskCreator);
        }
    }

    function _singleExecOnCancel(
        bytes32 _taskId,
        mapping(bytes32 => DataTypes.SingleExec) storage singleExecTask
    ) internal {
        delete singleExecTask[_taskId];
    }

    function _decodeSingleExecArgs(bytes memory _singleExecArgs)
        private
        pure
        returns (DataTypes.SingleExec memory)
    {
        (bool enabled, uint248 execTime) = abi.decode(
            _singleExecArgs,
            (bool, uint248)
        );

        return DataTypes.SingleExec(enabled, execTime);
    }
}
