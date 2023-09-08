// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../../../AutomateTaskCreator.sol";

/**
 * @dev
 * Example contract that creates a resolver task.
 */
// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
contract CounterResolverTaskCreator is AutomateTaskCreator {
    uint256 public count;
    uint256 public lastExecuted;
    bytes32 public taskId;
    uint256 public constant MAX_COUNT = 5;
    uint256 public constant INTERVAL = 3 minutes;

    event CounterTaskCreated(bytes32 taskId);

    constructor(address _automate) AutomateTaskCreator(_automate) {}

    function createTask() external {
        require(taskId == bytes32(""), "Already started task");

        ModuleData memory moduleData = ModuleData({
            modules: new Module[](2),
            args: new bytes[](2)
        });

        moduleData.modules[0] = Module.RESOLVER;
        moduleData.modules[1] = Module.PROXY;

        moduleData.args[0] = _resolverModuleArg(
            address(this),
            abi.encodeCall(this.checker, ())
        );
        moduleData.args[1] = _proxyModuleArg();

        bytes32 id = _createTask(
            address(this),
            abi.encode(this.increaseCount.selector),
            moduleData,
            address(0)
        );

        taskId = id;
        emit CounterTaskCreated(id);
    }

    function increaseCount(uint256 _amount) external onlyDedicatedMsgSender {
        uint256 newCount = count + _amount;

        if (newCount >= MAX_COUNT) {
            _cancelTask(taskId);
            count = 0;
        } else {
            count += _amount;
            lastExecuted = block.timestamp;
        }
    }

    function checker()
        external
        view
        returns (bool canExec, bytes memory execPayload)
    {
        canExec = (block.timestamp - lastExecuted) >= INTERVAL;

        execPayload = abi.encodeCall(this.increaseCount, (1));
    }
}
