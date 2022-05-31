// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.12;

import {OpsStorage} from "../OpsStorage.sol";
import {_call} from "../functions/FExec.sol";
import {ITaskModule} from "../interfaces/ITaskModule.sol";

abstract contract TaskModuleBase is OpsStorage, ITaskModule {
    function _onExecTaskHook(
        bool _lastModule,
        address _execAddress,
        bytes memory _execData,
        bool _revertOnFailure
    ) internal returns (bool callSuccess) {
        if (_lastModule)
            (callSuccess, ) = _call(
                _execAddress,
                _execData,
                _revertOnFailure,
                "Ops.exec: "
            );
    }
}
