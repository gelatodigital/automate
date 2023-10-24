// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

enum Module {
    RESOLVER,
    DEPRECATED_TIME,
    PROXY,
    SINGLE_EXEC,
    WEB3_FUNCTION,
    TRIGGER
}

enum TriggerType {
    TIME,
    CRON,
    EVENT,
    BLOCK
}

struct ModuleData {
    Module[] modules;
    bytes[] args;
}

interface IAutomate {
    function createTask(
        address execAddress,
        bytes calldata execDataOrSelector,
        ModuleData calldata moduleData,
        address feeToken
    ) external returns (bytes32 taskId);

    function cancelTask(bytes32 taskId) external;

    function getFeeDetails() external view returns (uint256, address);

    function gelato() external view returns (address payable);

    function taskModuleAddresses(Module) external view returns (address);
}

interface IProxyModule {
    function opsProxyFactory() external view returns (address);
}

interface IOpsProxyFactory {
    function getProxyOf(address account) external view returns (address, bool);
}

interface IGelato1Balance {
    function depositNative(address _sponsor) external payable;

    function depositToken(
        address _sponsor,
        address _token,
        uint256 _amount
    ) external;
}

interface IGelato {
    function feeCollector() external view returns (address);
}
