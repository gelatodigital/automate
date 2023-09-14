// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import {LibDataTypes} from "./LibDataTypes.sol";

/**
 * @notice Library to determine wether to call task modules to reduce unnecessary calls.
 */
library LibTaskModuleConfig {
    function requirePreCreate(LibDataTypes.Module _module)
        internal
        pure
        returns (bool)
    {
        if (_module == LibDataTypes.Module.PROXY) return true;

        return false;
    }

    function requirePreCancel(LibDataTypes.Module _module)
        internal
        pure
        returns (bool)
    {
        if (_module == LibDataTypes.Module.PROXY) return true;

        return false;
    }

    function requireOnCreate(LibDataTypes.Module _module)
        internal
        pure
        returns (bool)
    {
        if (_module == LibDataTypes.Module.PROXY) return true;

        return false;
    }

    function requirePreExec(LibDataTypes.Module _module)
        internal
        pure
        returns (bool)
    {
        if (_module == LibDataTypes.Module.PROXY) return true;

        return false;
    }

    function requirePostExec(LibDataTypes.Module _module)
        internal
        pure
        returns (bool)
    {
        if (_module == LibDataTypes.Module.SINGLE_EXEC) return true;

        return false;
    }
}
