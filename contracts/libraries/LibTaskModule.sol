// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import {_delegateCall} from "../functions/FExec.sol";
import {LibDataTypes} from "./LibDataTypes.sol";
import {ITaskModule} from "../interfaces/ITaskModule.sol";

library LibTaskModule {
    function onCreateTask(
        bytes32 _taskId,
        address _taskCreator,
        address _execAddress,
        bytes memory _execData,
        LibDataTypes.ModuleData memory _moduleData,
        mapping(LibDataTypes.Module => address) storage taskModuleAddresses
    ) internal {
        uint256 length = _moduleData.modules.length;

        _validModules(length, _moduleData.modules);

        for (uint256 i; i < length; i++) {
            LibDataTypes.Module module = _moduleData.modules[i];

            address taskModuleAddress = taskModuleAddresses[module];
            _moduleInitialised(taskModuleAddress);

            bytes memory delegatecallData = abi.encodeWithSelector(
                ITaskModule.onCreateTask.selector,
                _taskId,
                _taskCreator,
                _execAddress,
                _execData,
                _moduleData.args[i]
            );

            _delegateCall(
                taskModuleAddress,
                delegatecallData,
                "Ops.onCreateTask: "
            );
        }
    }

    function onExecTask(
        bytes32 _taskId,
        address _taskCreator,
        address _execAddress,
        bytes memory _execData,
        LibDataTypes.Module[] memory _modules,
        bool _revertOnFailure,
        mapping(LibDataTypes.Module => address) storage taskModuleAddresses
    ) internal returns (bool callSuccess) {
        uint256 length = _modules.length;

        bool lastModule;

        for (uint256 i; i < length; i++) {
            address taskModuleAddress = taskModuleAddresses[_modules[i]];
            _moduleInitialised(taskModuleAddress);

            lastModule = i == length - 1;

            bytes memory delegatecallData = abi.encodeWithSelector(
                ITaskModule.onExecTask.selector,
                lastModule,
                _taskId,
                _taskCreator,
                _execAddress,
                _execData,
                _revertOnFailure
            );

            (, bytes memory returnData) = _delegateCall(
                taskModuleAddress,
                delegatecallData,
                "Ops.onExecTask: "
            );

            (_execAddress, _execData, callSuccess) = abi.decode(
                returnData,
                (address, bytes, bool)
            );
        }
    }

    function _moduleInitialised(address _taskModuleAddress) private pure {
        require(
            _taskModuleAddress != address(0),
            "Ops._moduleInitialised: Not init"
        );
    }

    function _validModules(
        uint256 _length,
        LibDataTypes.Module[] memory _modules
    ) private pure {
        if (_length > 1)
            for (uint256 i; i < _length - 1; i++)
                require(
                    _modules[i + 1] > _modules[i],
                    "Ops._validModules: Asc only"
                );
    }
}
