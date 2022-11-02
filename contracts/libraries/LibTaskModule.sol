// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import {_call, _delegateCall} from "../functions/FExec.sol";
import {LibDataTypes} from "./LibDataTypes.sol";
import {LibTaskModuleConfig} from "./LibTaskModuleConfig.sol";
import {ITaskModule} from "../interfaces/ITaskModule.sol";

/**
 * @notice Library to call task modules on task creation and execution.
 */
library LibTaskModule {
    using LibTaskModuleConfig for LibDataTypes.Module;

    /**
     * @notice Delegate calls task modules before generating taskId.
     *
     * @param _execAddress Address of contract that will be called by Gelato.
     * @param _taskCreator The address which created the task.
     * @param taskModuleAddresses The storage reference to the mapping of modules to their address.
     */
    function preCreateTask(
        address _taskCreator,
        address _execAddress,
        mapping(LibDataTypes.Module => address) storage taskModuleAddresses
    ) internal returns (address, address) {
        uint256 length = uint256(type(LibDataTypes.Module).max);

        for (uint256 i; i <= length; i++) {
            LibDataTypes.Module module = LibDataTypes.Module(i);
            if (!module.requirePreCreate()) continue;

            address moduleAddress = taskModuleAddresses[module];
            _moduleInitialised(moduleAddress);

            bytes memory delegatecallData = abi.encodeWithSelector(
                ITaskModule.preCreateTask.selector,
                _taskCreator,
                _execAddress
            );

            (, bytes memory returnData) = _delegateCall(
                moduleAddress,
                delegatecallData,
                "Ops.preCreateTask: "
            );

            (_taskCreator, _execAddress) = abi.decode(
                returnData,
                (address, address)
            );
        }

        return (_taskCreator, _execAddress);
    }

    /**
     * @notice Delegate calls task modules on create task to initialise them.
     *
     * @param _taskId Unique hash of the task. {See LibTaskId-getTaskId}
     * @param _taskCreator The address which created the task.
     * @param _execAddress Address of contract that will be called by Gelato.
     * @param _execData Execution data to be called with / function selector.
     * @param _moduleData Modules that will be used for the task. {See LibDataTypes-ModuleData}
     * @param taskModuleAddresses The storage reference to the mapping of modules to their address.
     */
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
            if (!module.requireOnCreate()) continue;

            address moduleAddress = taskModuleAddresses[module];
            _moduleInitialised(moduleAddress);

            bytes memory delegatecallData = abi.encodeWithSelector(
                ITaskModule.onCreateTask.selector,
                _taskId,
                _taskCreator,
                _execAddress,
                _execData,
                _moduleData.args[i]
            );

            _delegateCall(
                moduleAddress,
                delegatecallData,
                "Ops.onCreateTask: "
            );
        }
    }

    /**
     * @notice Delegate calls task modules before removing task.
     *
     * @param _taskId Unique hash of the task. {See LibTaskId-getTaskId}
     * @param _taskCreator The address which created the task.
     * @param taskModuleAddresses The storage reference to the mapping of modules to their address.
     */
    function preCancelTask(
        bytes32 _taskId,
        address _taskCreator,
        mapping(LibDataTypes.Module => address) storage taskModuleAddresses
    ) internal returns (address) {
        uint256 length = uint256(type(LibDataTypes.Module).max);

        for (uint256 i; i <= length; i++) {
            LibDataTypes.Module module = LibDataTypes.Module(i);

            if (!module.requirePreCancel()) continue;

            address moduleAddress = taskModuleAddresses[module];
            _moduleInitialised(moduleAddress);

            bytes memory delegatecallData = abi.encodeWithSelector(
                ITaskModule.preCancelTask.selector,
                _taskId,
                _taskCreator
            );

            (, bytes memory returnData) = _delegateCall(
                moduleAddress,
                delegatecallData,
                "Ops.preCancelTask: "
            );

            (_taskCreator) = abi.decode(returnData, (address));
        }

        return _taskCreator;
    }

    /**
     * @notice Delegate calls task modules on exec.
     *
     * @param _taskId Unique hash of the task. {See LibTaskId-getTaskId}
     * @param _taskCreator The address which created the task.
     * @param _execAddress Address of contract that will be called by Gelato.
     * @param _execData Execution data to be called with / function selector.
     * @param _modules Modules that is used for the task. {See LibDataTypes-Module}
     * @param _revertOnFailure To revert or not if call to execAddress fails.
     * @param taskModuleAddresses The storage reference to the mapping of modules to their address.
     */
    function onExecTask(
        bytes32 _taskId,
        address _taskCreator,
        address _execAddress,
        bytes memory _execData,
        LibDataTypes.Module[] memory _modules,
        bool _revertOnFailure,
        mapping(LibDataTypes.Module => address) storage taskModuleAddresses
    ) internal returns (bool callSuccess) {
        address[] memory moduleAddresses = _getModuleAddresses(
            _modules,
            taskModuleAddresses
        );

        (_execAddress, _execData) = _preExecCall(
            _taskId,
            _taskCreator,
            _execAddress,
            _execData,
            _modules,
            moduleAddresses
        );

        (callSuccess, ) = _call(
            _execAddress,
            abi.encodePacked(_execData, _taskCreator),
            0,
            _revertOnFailure,
            "Ops.exec: "
        );

        _postExecCall(
            _taskId,
            _taskCreator,
            _execAddress,
            _execData,
            _modules,
            moduleAddresses
        );
    }

    function _preExecCall(
        bytes32 _taskId,
        address _taskCreator,
        address _execAddress,
        bytes memory _execData,
        LibDataTypes.Module[] memory _modules,
        address[] memory _moduleAddresses
    ) private returns (address, bytes memory) {
        uint256 length = _modules.length;

        for (uint256 i; i < length; i++) {
            if (!_modules[i].requirePreExec()) continue;

            bytes memory delegatecallData = abi.encodeWithSelector(
                ITaskModule.preExecCall.selector,
                _taskId,
                _taskCreator,
                _execAddress,
                _execData
            );

            (, bytes memory returnData) = _delegateCall(
                _moduleAddresses[i],
                delegatecallData,
                "Ops.preExecCall: "
            );

            (_execAddress, _execData) = abi.decode(
                returnData,
                (address, bytes)
            );
        }
        return (_execAddress, _execData);
    }

    function _postExecCall(
        bytes32 _taskId,
        address _taskCreator,
        address _execAddress,
        bytes memory _execData,
        LibDataTypes.Module[] memory _modules,
        address[] memory _moduleAddresses
    ) private {
        uint256 length = _moduleAddresses.length;

        for (uint256 i; i < length; i++) {
            if (!_modules[i].requirePostExec()) continue;

            bytes memory delegatecallData = abi.encodeWithSelector(
                ITaskModule.postExecCall.selector,
                _taskId,
                _taskCreator,
                _execAddress,
                _execData
            );

            _delegateCall(
                _moduleAddresses[i],
                delegatecallData,
                "Ops.postExecCall: "
            );
        }
    }

    function _getModuleAddresses(
        LibDataTypes.Module[] memory _modules,
        mapping(LibDataTypes.Module => address) storage taskModuleAddresses
    ) private view returns (address[] memory) {
        uint256 length = _modules.length;
        address[] memory moduleAddresses = new address[](length);

        for (uint256 i; i < length; i++) {
            moduleAddresses[i] = taskModuleAddresses[_modules[i]];
        }

        return moduleAddresses;
    }

    function _moduleInitialised(address _moduleAddress) private pure {
        require(
            _moduleAddress != address(0),
            "Ops._moduleInitialised: Not init"
        );
    }

    ///@dev Check for duplicate modules.
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
