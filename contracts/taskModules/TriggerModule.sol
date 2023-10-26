// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {TaskModuleBase} from "./TaskModuleBase.sol";
import {LibDataTypes} from "../libraries/LibDataTypes.sol";

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
        bytes memory triggerConfig = abi.encode(_start, _interval);

        return abi.encode(LibDataTypes.TriggerType.TIME, triggerConfig);
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
        bytes memory triggerConfig = abi.encode(_expression);

        return abi.encode(LibDataTypes.TriggerType.CRON, triggerConfig);
    }

    /**
     * @notice Helper function to encode arguments for TriggerModule for Event.
     *
     * @param _address Address to listen to for events.
     * @param _topics Set of topics to filter at each topic position.
     * @param _blockConfirmations Number of blocks to wait for before triggering.
     */
    function encodeEventTriggerModuleArg(
        address _address,
        bytes32[][] memory _topics,
        uint256 _blockConfirmations
    ) external pure returns (bytes memory) {
        bytes memory triggerConfig = abi.encode(
            _address,
            _topics,
            _blockConfirmations
        );

        return abi.encode(LibDataTypes.TriggerType.EVENT, triggerConfig);
    }

    /**
     * @notice Helper function to encode arguments for TriggerModule for Block.
     */
    function encodeBlockTriggerModuleArg()
        external
        pure
        returns (bytes memory)
    {
        return abi.encode(LibDataTypes.TriggerType.BLOCK);
    }
}
