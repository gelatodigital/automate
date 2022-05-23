// // SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {DataTypes} from "../libraries/DataTypes.sol";
import {Events} from "../libraries/Events.sol";

contract TimeModule {
    function _startTime(
        bytes32 _taskId,
        bytes memory _timeArgs,
        mapping(bytes32 => DataTypes.Time) storage timedTask
    ) internal {
        DataTypes.Time memory time = _decodeArgs(_timeArgs);

        require(
            time.interval > 0,
            "Ops: createTimedTask: interval cannot be 0"
        );

        uint128 nextExec = uint256(time.nextExec) > block.timestamp
            ? time.nextExec
            : uint128(block.timestamp);

        timedTask[_taskId] = DataTypes.Time({
            nextExec: nextExec,
            interval: time.interval
        });

        emit Events.TimerSet(_taskId, nextExec, time.interval);
    }

    function _updateTime(
        bytes32 _taskId,
        mapping(bytes32 => DataTypes.Time) storage timedTask
    ) internal {
        DataTypes.Time memory time = timedTask[_taskId];
        bool isTimedTask = time.nextExec != 0;

        if (isTimedTask) {
            require(
                time.nextExec <= uint128(block.timestamp),
                "Ops: _updateTime: Too early"
            );
            // If next execution would also be executed right now, skip forward to
            // the next execution in the future
            uint128 timeDiff = uint128(block.timestamp) - time.nextExec;
            uint128 intervals = timeDiff / time.interval + 1;

            timedTask[_taskId].nextExec =
                time.nextExec +
                (intervals * time.interval);
        }
    }

    function _deleteTime(
        bytes32 _taskId,
        mapping(bytes32 => DataTypes.Time) storage timedTask
    ) internal {
        delete timedTask[_taskId];
    }

    function _decodeArgs(bytes memory _timeArgs)
        private
        pure
        returns (DataTypes.Time memory)
    {
        (uint128 nextExec, uint128 interval) = abi.decode(
            _timeArgs,
            (uint128, uint128)
        );

        return DataTypes.Time(nextExec, interval);
    }
}
