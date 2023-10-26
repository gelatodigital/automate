// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../integrations/AutomateTaskCreator.sol";

//solhint-disable no-empty-blocks
contract AutomateTaskCreatorTest is AutomateTaskCreator {
    constructor(address _automate) AutomateTaskCreator(_automate) {}

    function resolverModuleData() external pure returns (ModuleData memory) {
        (
            address resolverAddress,
            bytes memory resolverData
        ) = resolverModuleArgs();

        ModuleData memory moduleData = ModuleData({
            modules: new Module[](1),
            args: new bytes[](1)
        });

        moduleData.modules[0] = Module.RESOLVER;
        moduleData.args[0] = _resolverModuleArg(resolverAddress, resolverData);

        return moduleData;
    }

    function proxyModuleData() external pure returns (ModuleData memory) {
        ModuleData memory moduleData = ModuleData({
            modules: new Module[](1),
            args: new bytes[](1)
        });

        moduleData.modules[0] = Module.PROXY;
        moduleData.args[0] = _proxyModuleArg();

        return moduleData;
    }

    function singleExecModuleData() external pure returns (ModuleData memory) {
        ModuleData memory moduleData = ModuleData({
            modules: new Module[](1),
            args: new bytes[](1)
        });

        moduleData.modules[0] = Module.SINGLE_EXEC;
        moduleData.args[0] = _singleExecModuleArg();

        return moduleData;
    }

    function web3FunctionModuleData()
        external
        pure
        returns (ModuleData memory)
    {
        (
            string memory web3FunctionHash,
            string memory currency,
            string memory oracleAddress
        ) = web3FunctionArg();

        bytes memory web3FunctionArgsHex = abi.encode(currency, oracleAddress);

        ModuleData memory moduleData = ModuleData({
            modules: new Module[](1),
            args: new bytes[](1)
        });

        moduleData.modules[0] = Module.WEB3_FUNCTION;
        moduleData.args[0] = _web3FunctionModuleArg(
            web3FunctionHash,
            web3FunctionArgsHex
        );

        return moduleData;
    }

    function timeTriggerModuleData() external pure returns (ModuleData memory) {
        (uint128 startTime, uint128 interval) = timeTriggerArg();

        ModuleData memory moduleData = ModuleData({
            modules: new Module[](1),
            args: new bytes[](1)
        });

        moduleData.modules[0] = Module.TRIGGER;
        moduleData.args[0] = _timeTriggerModuleArg(startTime, interval);

        return moduleData;
    }

    function cronTriggerModuleData() external pure returns (ModuleData memory) {
        string memory cronExpressionArg = cronTriggerArg();

        ModuleData memory moduleData = ModuleData({
            modules: new Module[](1),
            args: new bytes[](1)
        });

        moduleData.modules[0] = Module.TRIGGER;
        moduleData.args[0] = _cronTriggerModuleArg(cronExpressionArg);

        return moduleData;
    }

    function eventTriggerModuleData()
        external
        pure
        returns (ModuleData memory)
    {
        (
            address _address,
            bytes32[][] memory _topics,
            uint256 _blockConfirmations
        ) = eventTriggerArg();

        ModuleData memory moduleData = ModuleData({
            modules: new Module[](1),
            args: new bytes[](1)
        });

        moduleData.modules[0] = Module.TRIGGER;
        moduleData.args[0] = _eventTriggerModuleArg(
            _address,
            _topics,
            _blockConfirmations
        );

        return moduleData;
    }

    function blockTriggerModuleData()
        external
        pure
        returns (ModuleData memory)
    {
        ModuleData memory moduleData = ModuleData({
            modules: new Module[](1),
            args: new bytes[](1)
        });

        moduleData.modules[0] = Module.TRIGGER;
        moduleData.args[0] = _blockTriggerModuleArg();

        return moduleData;
    }

    function resolverModuleArgs() public pure returns (address, bytes memory) {
        return (0x1d810c54fa36a9Af4c9f547328CBe91f41444c19, "0xcf5303cf");
    }

    function web3FunctionArg()
        public
        pure
        returns (
            string memory,
            string memory,
            string memory
        )
    {
        return (
            "QmQdwLX9HkCqD4Hop18tuj3aH211uadPDdP6YX6nvbkbqY",
            "ethereum",
            "0x71B9B0F6C999CBbB0FeF9c92B80D54e4973214da"
        );
    }

    function timeTriggerArg() public pure returns (uint128, uint128) {
        return (1694000, 300000);
    }

    function cronTriggerArg() public pure returns (string memory) {
        return "*/5 * * * *";
    }

    function eventTriggerArg()
        public
        pure
        returns (
            address,
            bytes32[][] memory,
            uint256
        )
    {
        // [[A],[],[B,C],[]]
        bytes32[][] memory topics = new bytes32[][](4);
        //[A]
        topics[0] = new bytes32[](1);
        topics[0][0] = keccak256("A");

        //[B,C]
        topics[2] = new bytes32[](2);
        topics[2][0] = keccak256("B");
        topics[2][1] = keccak256("C");

        return (
            address(0x1d810c54fa36a9Af4c9f547328CBe91f41444c19),
            topics,
            100
        );
    }
}
