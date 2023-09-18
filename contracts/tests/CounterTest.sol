// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract CounterTest {
    address public automate;
    uint256 public count;
    uint256 public lastExecuted;

    constructor(address payable _automate) {
        automate = _automate;
    }

    // solhint-disable not-rely-on-time
    function increaseCount(uint256 amount) external {
        require(
            ((block.timestamp - lastExecuted) > 180),
            "Counter: increaseCount: Time not elapsed"
        );

        count += amount;
        lastExecuted = block.timestamp;
    }

    function increaseCountReverts(uint256 amount) external {
        require(false, "Counter: reverts");

        count += amount;
        lastExecuted = block.timestamp;
    }

    function checker()
        external
        view
        returns (bool canExec, bytes memory execPayload)
    {
        canExec = (block.timestamp - lastExecuted) > 180;

        execPayload = abi.encodeCall(this.increaseCount, (1));
    }

    function checkerReverts()
        external
        view
        returns (bool canExec, bytes memory execPayload)
    {
        canExec = (block.timestamp - lastExecuted) > 180;

        execPayload = abi.encodeCall(this.increaseCountReverts, (1));
    }
}
