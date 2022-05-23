// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

library DataTypes {
    enum Modules {
        TIME,
        SINGLE
    }

    struct TaskModules {
        Time time;
        SingleExec enabled;
    }

    struct Time {
        uint128 nextExec;
        uint128 interval;
    }

    struct SingleExec {
        bool enabled;
        uint248 execTime;
    }
}
