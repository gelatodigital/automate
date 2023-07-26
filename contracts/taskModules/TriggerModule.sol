// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {TaskModuleBase} from "./TaskModuleBase.sol";
import {LibDataTypes} from "../libraries/LibDataTypes.sol";
import {LibEvents} from "../libraries/LibEvents.sol";

// solhint-disable not-rely-on-time
contract TriggerModule is TaskModuleBase {
    ///@inheritdoc TaskModuleBase
    function onCreateTask(
        bytes32 _taskId,
        address,
        address,
        bytes calldata,
        bytes calldata _arg
    ) external override {
        LibDataTypes.TriggerModuleData memory moduleData = _decodeModuleArg(
            _arg
        );

        if (moduleData.triggerType == LibDataTypes.TriggerType.TIME) {
            (uint128 start, uint128 interval) = _decodeTimeTriggerModuleArg(
                moduleData.triggerConfig
            );

            uint128 actualStart = uint256(start) > block.timestamp
                ? start
                : uint128(block.timestamp);

            triggerTaskTypes[_taskId] = LibDataTypes.TriggerType.TIME;
            timeTriggerTask[_taskId] = LibDataTypes.TimeTriggerConfig(
                actualStart,
                interval
            );

            emit LibEvents.TimeTriggerSet(_taskId, actualStart, interval);
        } else if (moduleData.triggerType == LibDataTypes.TriggerType.CRON) {
            string memory expression = _decodeCronTriggerModuleArg(
                moduleData.triggerConfig
            );

            triggerTaskTypes[_taskId] = LibDataTypes.TriggerType.CRON;
            cronTriggerTask[_taskId] = LibDataTypes.CronTriggerConfig(
                expression
            );

            emit LibEvents.CronTriggerSet(_taskId, expression);
        }
    }

    function preCancelTask(bytes32 _taskId, address _taskCreator)
        external
        override
        returns (address)
    {
        LibDataTypes.TriggerType triggerType = triggerTaskTypes[_taskId];

        if (triggerType == LibDataTypes.TriggerType.TIME) {
            delete timeTriggerTask[_taskId];
        } else if (triggerType == LibDataTypes.TriggerType.CRON) {
            delete cronTriggerTask[_taskId];
        }

        return _taskCreator;
    }

    /**
     * @notice Helper function to encode arguments for TriggerModule for Timer.
     *
     * @param _start Time when the first execution should occur.
     * @param _interval Time interval between each execution.
     */
    function encodeTimeTriggerModuleArg(uint128 _start, uint128 _interval)
        external
        pure
        returns (bytes memory)
    {
        return abi.encode(_start, _interval);
    }

    /**
     * @notice Helper function to encode arguments for TriggerModule for Cron.
     *
     * @param _expression Cron expression
     */
    function encodeCronTriggerModuleArg(string calldata _expression)
        external
        pure
        returns (bytes memory)
    {
        return abi.encode(_expression);
    }

    function _decodeModuleArg(bytes calldata _arg)
        private
        pure
        returns (LibDataTypes.TriggerModuleData memory moduleData)
    {
        (moduleData) = abi.decode(_arg, (LibDataTypes.TriggerModuleData));
    }

    function _decodeTimeTriggerModuleArg(bytes memory _arg)
        private
        pure
        returns (uint128 start, uint128 interval)
    {
        (start, interval) = abi.decode(_arg, (uint128, uint128));
    }

    function _decodeCronTriggerModuleArg(bytes memory _arg)
        private
        pure
        returns (string memory expression)
    {
        (expression) = abi.decode(_arg, (string));
    }
}
