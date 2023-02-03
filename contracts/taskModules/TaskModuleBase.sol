// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {AutomateStorage} from "../AutomateStorage.sol";
import {ITaskModule} from "../interfaces/ITaskModule.sol";

// solhint-disable no-empty-blocks
abstract contract TaskModuleBase is AutomateStorage, ITaskModule {
    ///@inheritdoc ITaskModule
    function preCreateTask(address _taskCreator, address _execAddress)
        external
        virtual
        override
        returns (address, address)
    {
        return (_taskCreator, _execAddress);
    }

    ///@inheritdoc ITaskModule
    function onCreateTask(
        bytes32,
        address,
        address,
        bytes calldata,
        bytes calldata
    ) external virtual override {}

    ///@inheritdoc ITaskModule
    function preCancelTask(bytes32, address _taskCreator)
        external
        virtual
        override
        returns (address)
    {
        return _taskCreator;
    }

    ///@inheritdoc ITaskModule
    function preExecCall(
        bytes32,
        address,
        address _execAddress,
        bytes calldata _execData
    ) external virtual override returns (address, bytes memory) {
        return (_execAddress, _execData);
    }

    ///@inheritdoc ITaskModule
    function postExecCall(
        bytes32 taskId,
        address taskCreator,
        address execAddress,
        bytes calldata execData
    ) external virtual override {}
}
