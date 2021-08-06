// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

import { IResolver } from "./interfaces/IResolver.sol";

interface ICounter {
  function lastExecuted() external view returns (uint256);

  function increaseCount(uint256 amount) external;
}

contract CounterResolver is IResolver {
  address public immutable COUNTER;
  string public OK = "OK";

  constructor(address _counter) {
    COUNTER = _counter;
  }

  function checker()
    external
    view
    override
    returns (string memory message, bytes memory execPayload)
  {
    uint256 lastExecuted = ICounter(COUNTER).lastExecuted();

    message = "Time has not elapsed!";

    if ((block.timestamp - lastExecuted) > 180) message = OK;

    execPayload = abi.encodeWithSelector(
      ICounter.increaseCount.selector,
      uint256(100)
    );
  }
}
