// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "../../../AutomateTaskCreator.sol";

//solhint-disable no-empty-blocks
//solhint-disable not-rely-on-time
contract CounterWeb3Function is AutomateTaskCreator {
    uint256 public count;
    uint256 public lastExecuted;
    bytes32 public taskId;
    uint256 public constant MAX_COUNT = 5;
    uint256 public constant INTERVAL = 3 minutes;

    event CounterTaskCreated(bytes32 taskId);

    constructor(address _automate) AutomateTaskCreator(_automate) {}

    function createTask(
        string memory _web3FunctionHash,
        bytes calldata _web3FunctionArgsHex
    ) external {
        require(taskId == bytes32(""), "Already started task");

        bytes memory execData = abi.encodeCall(this.increaseCount, (1));

        ModuleData memory moduleData = ModuleData({
            modules: new Module[](2),
            args: new bytes[](2)
        });
        moduleData.modules[0] = Module.PROXY;
        moduleData.modules[1] = Module.WEB3_FUNCTION;

        moduleData.args[0] = _proxyModuleArg();
        moduleData.args[1] = _web3FunctionModuleArg(
            _web3FunctionHash,
            _web3FunctionArgsHex
        );

        bytes32 id = _createTask(
            address(this),
            execData,
            moduleData,
            address(0)
        );

        taskId = id;
        emit CounterTaskCreated(id);
    }

    function cancelTask() external {
        require(taskId != bytes32(""), "Task not started");
        _cancelTask(taskId);
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

    function depositFunds(uint256 _amount, address _token) external payable {
        _depositFunds1Balance(_amount, _token, address(this));
    }
}
