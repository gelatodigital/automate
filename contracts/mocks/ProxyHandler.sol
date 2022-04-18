// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

interface ICounter {
    function increaseCount(uint256 _count) external;
}

contract ProxyHandler {
    address public immutable counter;

    constructor(address _counter) {
        counter = _counter;
    }

    function increaseCount(uint256 _count) external {
        ICounter(counter).increaseCount(_count);
    }
}
