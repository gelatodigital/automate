// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.14;

import {TimeCreator} from "../TimeCreator.sol";

/**
 * @notice
 * Example of creating a task which tells
 * Gelato to call a function at a specified interval.
 */
// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
contract CounterTimeCreator is TimeCreator {
    uint256 public count;
    uint256 public lastExecuted;
    bytes32 public taskId;
    uint256 public constant MAX_COUNT = 5;
    uint256 public constant INTERVAL = 3 minutes;

    event CounterTaskCreated(bytes32 taskId);

    constructor(address payable _ops, address _owner)
        TimeCreator(_ops, _owner)
    {}

    function createTask() external payable {
        require(taskId == bytes32(""), "Already started task");

        bytes memory execData = abi.encodeCall(this.increaseCount, (1));

        if (msg.value > 0) depositFunds(msg.value, _ETH);

        bytes32 id = _createTask(
            address(this),
            execData,
            address(0),
            block.timestamp,
            INTERVAL
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
}
