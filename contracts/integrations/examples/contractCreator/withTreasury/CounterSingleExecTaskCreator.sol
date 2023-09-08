// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../../../AutomateTaskCreator.sol";

/**
 * @dev
 * Example contract that creates a single exec task.
 */
// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
contract CounterSingleExecTaskCreator is AutomateTaskCreator {
    uint256 public count;
    uint256 public lastExecuted;
    bytes32 public taskId;
    uint256 public constant MAX_COUNT = 5;
    uint256 public constant INTERVAL = 3 minutes;

    event CounterTaskCreated(bytes32 taskId);

    constructor(address _automate) AutomateTaskCreator(_automate) {}

    function createTask() external {
        require(taskId == bytes32(""), "Already started task");

        bytes memory execData = abi.encodeCall(this.increaseCount, (1));

        ModuleData memory moduleData = ModuleData({
            modules: new Module[](2),
            args: new bytes[](2)
        });
        moduleData.modules[0] = Module.PROXY;
        moduleData.modules[1] = Module.SINGLE_EXEC;

        moduleData.args[0] = _proxyModuleArg();
        moduleData.args[1] = _singleExecModuleArg();

        bytes32 id = _createTask(
            address(this),
            execData,
            moduleData,
            address(0)
        );

        taskId = id;
        emit CounterTaskCreated(id);
    }

    function increaseCount(uint256 _amount) external onlyDedicatedMsgSender {
        count += _amount;
        taskId = bytes32("");
    }
}
