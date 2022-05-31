// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.12;

import {OpsStorage} from "../OpsStorage.sol";
import {TaskModuleBase} from "./TaskModuleBase.sol";
import {LibDataTypes} from "../libraries/LibDataTypes.sol";
import {LibEvents} from "../libraries/LibEvents.sol";

// solhint-disable not-rely-on-time
contract TimeModule is TaskModuleBase {
    function onCreateTask(
        bytes32 _taskId,
        address,
        address,
        bytes calldata,
        bytes calldata _arg
    ) external override {
        (uint128 startTime, uint128 interval) = _decodeModuleArg(_arg);

        uint128 nextExec = uint256(startTime) > block.timestamp
            ? startTime
            : uint128(block.timestamp);

        timedTask[_taskId] = LibDataTypes.Time(nextExec, interval);

        emit LibEvents.TimerSet(_taskId, nextExec, interval);
    }

    function onExecTask(
        bool _lastModule,
        bytes32 _taskId,
        address,
        address _execAddress,
        bytes calldata _execData,
        bool _revertOnFailure
    )
        external
        override
        returns (
            address,
            bytes memory,
            bool callSuccess
        )
    {
        callSuccess = _onExecTaskHook(
            _lastModule,
            _execAddress,
            _execData,
            _revertOnFailure
        );

        LibDataTypes.Time memory time = timedTask[_taskId];
        bool isTimedTask = time.nextExec != 0;

        if (isTimedTask) {
            require(
                time.nextExec <= uint128(block.timestamp),
                "TimeModule: Too early"
            );

            uint128 timeDiff = uint128(block.timestamp) - time.nextExec;
            uint128 intervals = (timeDiff / time.interval) + 1;

            timedTask[_taskId].nextExec =
                time.nextExec +
                (intervals * time.interval);
        }

        return (_execAddress, _execData, callSuccess);
    }

    function _decodeModuleArg(bytes calldata _arg)
        private
        pure
        returns (uint128 startTime, uint128 interval)
    {
        (startTime, interval) = abi.decode(_arg, (uint128, uint128));
    }
}
