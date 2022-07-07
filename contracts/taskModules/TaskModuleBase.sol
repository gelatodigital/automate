// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.12;

import {OpsStorage} from "../OpsStorage.sol";
import {_call} from "../functions/FExec.sol";
import {ITaskModule} from "../interfaces/ITaskModule.sol";

// solhint-disable no-empty-blocks
abstract contract TaskModuleBase is OpsStorage, ITaskModule {
    ///@inheritdoc ITaskModule
    function preCreateTask(address, address)
        external
        virtual
        override
        returns (address, address)
    {}

    ///@inheritdoc ITaskModule
    function onCreateTask(
        bytes32,
        address,
        address,
        bytes calldata,
        bytes calldata
    ) external virtual override {}

    ///@inheritdoc ITaskModule
    function preExecTask(
        bytes32,
        address,
        address _execAddress,
        bytes calldata _execData
    ) external virtual override returns (address, bytes memory) {
        return (_execAddress, _execData);
    }

    ///@inheritdoc ITaskModule
    function postExecTask(
        bytes32 taskId,
        address taskCreator,
        address execAddress,
        bytes calldata execData
    ) external virtual override {}
}
