// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {DataTypes} from "./DataTypes.sol";

library LibLegacyTask {
    function getLegacyCreateTaskArgs(bytes4 _funcSig, bytes calldata _callData)
        internal
        pure
        returns (
            address execAddress,
            bytes4 execSelector,
            address resolverAddress,
            bytes memory resolverData,
            address feeToken,
            DataTypes.Modules[] memory taskModules,
            bytes[] memory taskModuleArgs
        )
    {
        if (_funcSig == _legacyCreateTaskFuncSig()) {
            (execAddress, execSelector, resolverAddress, resolverData) = abi
                .decode(_callData, (address, bytes4, address, bytes));
        } else if (_funcSig == _legacyCreateTaskNoPrePaymentFuncSig()) {
            (
                execAddress,
                execSelector,
                resolverAddress,
                resolverData,
                feeToken
            ) = abi.decode(
                _callData,
                (address, bytes4, address, bytes, address)
            );
        } else if (_funcSig == _legacyCreateTimedTaskFuncSig()) {
            uint128 startTime;
            uint128 interval;
            (
                startTime,
                interval,
                execAddress,
                execSelector,
                resolverAddress,
                resolverData,
                feeToken
            ) = abi.decode(
                _callData,
                (uint128, uint128, address, bytes4, address, bytes, address)
            );

            taskModules[0] = DataTypes.Modules.TIME;
            taskModuleArgs[0] = abi.encode(startTime, interval);
        } else revert("Ops: createTask: Function not found");
    }

    function _legacyCreateTaskFuncSig() private pure returns (bytes4) {
        return bytes4(keccak256("createTask(address,bytes4,address,bytes)"));
    }

    function _legacyCreateTaskNoPrePaymentFuncSig()
        private
        pure
        returns (bytes4)
    {
        return
            bytes4(
                keccak256(
                    "createTaskNoPrepayment(address,bytes4,address,bytes,address)"
                )
            );
    }

    function _legacyCreateTimedTaskFuncSig() private pure returns (bytes4) {
        return
            bytes4(
                keccak256(
                    "createTimedTask(uint128,uint128,address,bytes4,address,bytes,address)"
                )
            );
    }
}
