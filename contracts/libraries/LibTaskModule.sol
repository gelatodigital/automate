// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import {_call, _delegateCall} from "../functions/FExec.sol";
import {LibDataTypes} from "./LibDataTypes.sol";
import {LibTaskModuleConfig} from "./LibTaskModuleConfig.sol";
import {ITaskModule} from "../interfaces/ITaskModule.sol";

// solhint-disable function-max-lines
/// @notice Library to call task modules on task creation and execution.
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
        uint256 length = uint256(type(LibDataTypes.Module).max) + 1;

        for (uint256 i; i < length; i++) {
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
                "Automate.preCreateTask: "
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

        _validModules(_moduleData.modules);

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
                "Automate.onCreateTask: "
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
                "Automate.preCancelTask: "
            );

            (_taskCreator) = abi.decode(returnData, (address));
        }

        return _taskCreator;
    }

    /**
     * @notice Delegate calls task modules on exec.
     *
     * @param _taskId Unique hash of the task. {See LibTaskId-getTaskId}
     * @param _taskCreator Address which created the task.
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

        (_execAddress, _execData) = preExecCall(
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
            "Automate.exec: "
        );

        postExecCall(
            _taskId,
            _taskCreator,
            _execAddress,
            _execData,
            _modules,
            moduleAddresses
        );
    }

    function preExecCall(
        bytes32 _taskId,
        address _taskCreator,
        address _execAddress,
        bytes memory _execData,
        LibDataTypes.Module[] memory _modules,
        address[] memory _moduleAddresses
    ) internal returns (address, bytes memory) {
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
                "Automate.preExecCall: "
            );

            (_execAddress, _execData) = abi.decode(
                returnData,
                (address, bytes)
            );
        }
        return (_execAddress, _execData);
    }

    function postExecCall(
        bytes32 _taskId,
        address _taskCreator,
        address _execAddress,
        bytes memory _execData,
        LibDataTypes.Module[] memory _modules,
        address[] memory _moduleAddresses
    ) internal {
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
                "Automate.postExecCall: "
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
            "Automate._moduleInitialised: Not init"
        );
    }

    /**
     * @dev
     * - No duplicate modules
     * - No deprecated TIME
     * - No RESOLVER && WEB3_FUNCTION
     * - PROXY is required
     */
    function _validModules(LibDataTypes.Module[] memory _modules) private pure {
        uint256 length = _modules.length;

        uint256 existsLength = uint256(type(LibDataTypes.Module).max) + 1;
        bool[] memory exists = new bool[](existsLength);

        for (uint256 i = 0; i < length; i++) {
            if (i > 0) {
                require(
                    _modules[i] > _modules[i - 1],
                    "Automate._validModules: Asc only"
                );
            }

            exists[uint256(_modules[i])] = true;
        }

        require(
            !exists[uint256(LibDataTypes.Module.DEPRECATED_TIME)],
            "Automate._validModules: TIME is deprecated"
        );

        require(
            !(exists[uint256(LibDataTypes.Module.RESOLVER)] &&
                exists[uint256(LibDataTypes.Module.WEB3_FUNCTION)]),
            "Automate._validModules: Only RESOLVER or WEB3_FUNCTION"
        );

        require(
            exists[uint256(LibDataTypes.Module.PROXY)],
            "Automate._validModules: PROXY is required"
        );
    }
}
