// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

interface IResolver {
  function checker()
    external
    view
    returns (string memory message, bytes memory execPayload);
}
