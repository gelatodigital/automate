// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.14;

import "./Types.sol";

abstract contract AutomateModuleHelper {
    function _resolverModuleArg(
        address _resolverAddress,
        bytes memory _resolverData
    ) internal pure returns (bytes memory) {
        return abi.encode(_resolverAddress, _resolverData);
    }

    function _proxyModuleArg() internal pure returns (bytes memory) {
        return bytes("");
    }

    function _singleExecModuleArg() internal pure returns (bytes memory) {
        return bytes("");
    }

    function _web3FunctionModuleArg(
        string memory _web3FunctionHash,
        bytes memory _web3FunctionArgsHex
    ) internal pure returns (bytes memory) {
        return abi.encode(_web3FunctionHash, _web3FunctionArgsHex);
    }

    function _timeTriggerModuleArg(uint128 _start, uint128 _interval)
        internal
        pure
        returns (bytes memory)
    {
        bytes memory triggerConfig = abi.encode(_start, _interval);

        return abi.encode(TriggerType.TIME, triggerConfig);
    }

    function _cronTriggerModuleArg(string memory _expression)
        internal
        pure
        returns (bytes memory)
    {
        bytes memory triggerConfig = abi.encode(_expression);

        return abi.encode(TriggerType.CRON, triggerConfig);
    }

    function _eventTriggerModuleArg(
        address _address,
        bytes32[][] memory _topics,
        uint256 _blockConfirmations
    ) internal pure returns (bytes memory) {
        bytes memory triggerConfig = abi.encode(
            _address,
            _topics,
            _blockConfirmations
        );

        return abi.encode(TriggerType.EVENT, triggerConfig);
    }

    function _blockTriggerModuleArg() internal pure returns (bytes memory) {
        bytes memory triggerConfig = abi.encode(bytes(""));

        return abi.encode(TriggerType.BLOCK, triggerConfig);
    }
}
