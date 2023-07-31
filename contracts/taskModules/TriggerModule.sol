// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {TaskModuleBase} from "./TaskModuleBase.sol";
import {LibDataTypes} from "../libraries/LibDataTypes.sol";
import {LibEvents} from "../libraries/LibEvents.sol";

// solhint-disable not-rely-on-time
contract TriggerModule is TaskModuleBase {
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
