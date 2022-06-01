// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import {_call, _delegateCall} from "../functions/FExec.sol";
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
        address[] memory moduleAddresses;
        (moduleAddresses, _execAddress, _execData) = _preExecTask(
            _taskId,
            _taskCreator,
            _execAddress,
            _execData,
            _modules,
            taskModuleAddresses
        );

        (callSuccess, ) = _call(
            _execAddress,
            _execData,
            _revertOnFailure,
            "Ops.exec: "
        );

        _postExecTask(
            _taskId,
            _taskCreator,
            _execAddress,
            _execData,
            moduleAddresses
        );
    }

    function _preExecTask(
        bytes32 _taskId,
        address _taskCreator,
        address _execAddress,
        bytes memory _execData,
        LibDataTypes.Module[] memory _modules,
        mapping(LibDataTypes.Module => address) storage taskModuleAddresses
    )
        private
        returns (
            address[] memory,
            address,
            bytes memory
        )
    {
        uint256 length = _modules.length;
        address[] memory moduleAddresses = new address[](length);

        for (uint256 i; i < length; i++) {
            moduleAddresses[i] = taskModuleAddresses[_modules[i]];

            bytes memory delegatecallData = abi.encodeWithSelector(
                ITaskModule.preExecTask.selector,
                _taskId,
                _taskCreator,
                _execAddress,
                _execData
            );

            (, bytes memory returnData) = _delegateCall(
                moduleAddresses[i],
                delegatecallData,
                "Ops.preExecTask: "
            );

            (_execAddress, _execData) = abi.decode(
                returnData,
                (address, bytes)
            );
        }
        return (moduleAddresses, _execAddress, _execData);
    }

    function _postExecTask(
        bytes32 _taskId,
        address _taskCreator,
        address _execAddress,
        bytes memory _execData,
        address[] memory _moduleAddresses
    ) private {
        uint256 length = _moduleAddresses.length;

        for (uint256 i; i < length; i++) {
            bytes memory delegatecallData = abi.encodeWithSelector(
                ITaskModule.postExecTask.selector,
                _taskId,
                _taskCreator,
                _execAddress,
                _execData
            );

            _delegateCall(
                _moduleAddresses[i],
                delegatecallData,
                "Ops.postExecTask: "
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
