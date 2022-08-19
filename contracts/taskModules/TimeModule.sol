// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {TaskModuleBase} from "./TaskModuleBase.sol";
import {LibDataTypes} from "../libraries/LibDataTypes.sol";
import {LibEvents} from "../libraries/LibEvents.sol";

// solhint-disable not-rely-on-time
contract TimeModule is TaskModuleBase {
    ///@inheritdoc TaskModuleBase
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

    function preCancelTask(bytes32 _taskId, address _taskCreator)
        external
        override
        returns (address)
    {
        delete timedTask[_taskId];

        return _taskCreator;
    }

    /**
     * @inheritdoc TaskModuleBase
     * @dev Time is updated at preExec because if
     * SingleExec is used concurrently, it will delete timedTask.
     */
    function preExecCall(
        bytes32 _taskId,
        address,
        address _execAddress,
        bytes calldata _execData
    ) external override returns (address, bytes memory) {
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
        return (_execAddress, _execData);
    }

    /**
     * @notice Helper function to encode arguments for TimeModule.
     *
     * @param _startTime Time when the first execution should occur.
     * @param _interval Time interval between each execution.
     */
    function encodeModuleArg(address _startTime, bytes calldata _interval)
        external
        pure
        returns (bytes memory)
    {
        return abi.encode(_startTime, _interval);
    }

    function _decodeModuleArg(bytes calldata _arg)
        private
        pure
        returns (uint128 startTime, uint128 interval)
    {
        (startTime, interval) = abi.decode(_arg, (uint128, uint128));
    }
}
