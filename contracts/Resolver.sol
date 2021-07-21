// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

contract Resolver {
  function genPayloadAndCanExec(uint256 _increment)
    external
    view
    returns (bytes memory _execData)
  {
    bytes4 selector = bytes4(keccak256("increaseCount(uint256)"));
    _execData = abi.encodeWithSelector(selector, _increment);
  }
}
