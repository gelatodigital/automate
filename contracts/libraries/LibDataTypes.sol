// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

// solhint-disable max-line-length
library LibDataTypes {
    /**
     * @notice Whitelisted modules that are available for users to customise conditions and specifications of their tasks.
     *
     * @param RESOLVER Use dynamic condition & input data for execution. {See ResolverModule.sol}
     * @param DEPRECATED_TIME deprecated
     * @param PROXY Creates a dedicated caller (msg.sender) to be used when executing the task. {See ProxyModule.sol}
     * @param SINGLE_EXEC Task is cancelled after one execution. {See SingleExecModule.sol}
     * @param WEB3_FUNCTION Use off-chain condition & input data for execution. {See Web3FunctionModule.sol}
     * @param TRIGGER Repeated execution of task ata a specified timing and interval or cron. {See TriggerModule.sol}
     */
    enum Module {
        RESOLVER,
        DEPRECATED_TIME, // @deprecated
        PROXY,
        SINGLE_EXEC,
        WEB3_FUNCTION,
        TRIGGER
    }

    /**
     * @notice Struct to contain modules and their relative arguments that are used for task creation.
     *
     * @param modules List of selected modules.
     * @param args Arguments of modules if any. Pass "0x" for modules which does not require args {See encodeModuleArg}
     */
    struct ModuleData {
        Module[] modules;
        bytes[] args;
    }

    /**
     * @notice Struct for time module.
     *
     * @param nextExec Time when the next execution should occur.
     * @param interval Time interval between each execution.
     */
    struct Time {
        uint128 nextExec;
        uint128 interval;
    }

    /**
     * @notice Types of trigger
     *
     * @param TIME Time triggered tasks, starting at a specific time and triggered intervally
     * @param CRON Cron triggered tasks, triggered according to the cron conditions
     */
    enum TriggerType {
        TIME,
        CRON,
        EVENT,
        BLOCK
    }

    /**
     * @notice Struct for trigger module
     *
     * @param triggerType Type of the trigger
     * @param triggerConfig Trigger configuration that shuold be parsed according to triggerType
     */
    struct TriggerModuleData {
        TriggerType triggerType;
        bytes triggerConfig;
    }
}
