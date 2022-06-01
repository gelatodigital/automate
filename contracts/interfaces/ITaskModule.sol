// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

interface ITaskModule {
    function onCreateTask(
        bytes32 taskId,
        address taskCreator,
        address execAddress,
        bytes calldata execData,
        bytes calldata initModuleArg
    ) external;

    function preExecTask(
        bytes32 taskId,
        address taskCreator,
        address execAddress,
        bytes calldata execData
    ) external returns (address execAddress_, bytes memory execData_);

    function postExecTask(
        bytes32 taskId,
        address taskCreator,
        address execAddress,
        bytes calldata execData
    ) external returns (address execAddress_, bytes memory execData_);
}
