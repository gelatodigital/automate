// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IForwarder {
    function checker(bytes memory execData)
        external
        pure
        returns (bool, bytes memory);
}
