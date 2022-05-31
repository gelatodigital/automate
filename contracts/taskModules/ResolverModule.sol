// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.12;

import {TaskModuleBase} from "./TaskModuleBase.sol";
import {LibEvents} from "../libraries/LibEvents.sol";

contract ResolverModule is TaskModuleBase {
    function onCreateTask(
        bytes32 _taskId,
        address,
        address,
        bytes calldata,
        bytes calldata _arg
    ) external override {
        (address resolverAddress, bytes memory resolverData) = _decodeArg(_arg);

        emit LibEvents.ResolverSet(_taskId, resolverAddress, resolverData);
    }

    function onExecTask(
        bool _lastModule,
        bytes32,
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

        return (_execAddress, _execData, callSuccess);
    }

    function _decodeArg(bytes calldata _arg)
        private
        pure
        returns (address resolverAddress, bytes memory resolverData)
    {
        (resolverAddress, resolverData) = abi.decode(_arg, (address, bytes));
    }
}
