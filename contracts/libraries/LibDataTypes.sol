// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

library LibDataTypes {
    enum Module {
        RESOLVER,
        TIME,
        PROXY,
        SINGLE_EXEC
    }

    struct ModuleData {
        Module[] modules;
        bytes[] args;
    }

    struct Time {
        uint128 nextExec;
        uint128 interval;
    }
}
