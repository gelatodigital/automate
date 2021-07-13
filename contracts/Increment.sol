// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

contract Increment {
  uint256 public counter;
  bool public allowExec;
  address public immutable owner;

  constructor() {
    allowExec = false;
    owner = msg.sender;
  }

  function increment(uint256 _number) external {
    require(allowExec, "Increment: increment: Exec not allowed");

    counter += _number;
  }

  function toggleAllowExec() external {
    allowExec = !allowExec;
  }

  function canExec(bytes calldata data)
    external
    returns (
      bool _canExec,
      address _callee,
      bytes memory _data
    )
  {
    (bool success, ) = address(this).call(data);
    _canExec = success;
    _callee = owner;
    _data = data;
  }
}
