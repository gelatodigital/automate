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

    function onExecTask(
        bool lastModule,
        bytes32 taskId,
        address taskCreator,
        address execAddress,
        bytes calldata execData,
        bool revertOnFailure
    )
        external
        returns (
            address execAddress_,
            bytes memory execData_,
            bool callSuccess
        );
}
