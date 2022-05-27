// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

library LibDataTypes {
    struct Time {
        uint128 nextExec;
        uint128 interval;
    }
}
