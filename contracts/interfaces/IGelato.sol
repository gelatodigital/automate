// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

interface IGelato {
  function canExec(address _executor) external view returns (bool);

  function isExecutor(address _executor) external view returns (bool);

  function executors() external view returns (address[] memory);
}
