// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../integrations/OpsReady.sol";

// solhint-disable no-empty-blocks
// solhint-disable not-rely-on-time
contract CounterTestWT is OpsReady {
    uint256 public count;
    uint256 public lastExecuted;

    constructor(address _ops, address _taskCreator)
        OpsReady(_ops, _taskCreator)
    {}

    receive() external payable {}

    function increaseCount(uint256 amount) external {
        require(
            ((block.timestamp - lastExecuted) > 180),
            "Counter: increaseCount: Time not elapsed"
        );

        count += amount;
        lastExecuted = block.timestamp;

        (uint256 fee, address feeToken) = _getFeeDetails();

        _transfer(fee, feeToken);
    }

    function checker()
        external
        view
        returns (bool canExec, bytes memory execPayload)
    {
        canExec = (block.timestamp - lastExecuted) > 180;

        execPayload = abi.encodeCall(this.increaseCount, (1));
    }
}
