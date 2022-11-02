// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.14;

import {ResolverCreator} from "../ResolverCreator.sol";

/**
 * @notice
 * Example of creating a task with a resolver
 * that tells Gelato when to call a function.
 */
// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
contract CounterResolverCreator is ResolverCreator {
    uint256 public count;
    uint256 public lastExecuted;
    bytes32 public taskId;
    uint256 public constant MAX_COUNT = 5;
    uint256 public constant INTERVAL = 3 minutes;

    event CounterTaskCreated(bytes32 taskId);

    constructor(address payable _ops, address _owner)
        ResolverCreator(_ops, _owner)
    {}

    function createTask() external payable {
        require(taskId == bytes32(""), "Already started task");

        bytes memory resolverData = abi.encodeCall(this.checker, ());
        bytes memory execSelector = abi.encode(this.increaseCount.selector);

        if (msg.value > 0) depositFunds(msg.value, _ETH);

        bytes32 id = _createTask(
            address(this),
            execSelector,
            address(0),
            address(this),
            resolverData
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
