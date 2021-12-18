// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

import {PokeMeReady} from "./PokeMeReady.sol";

contract Counter is PokeMeReady {
    uint256 public count;
    uint256 public lastExecuted;
    address public immutable owner;

    constructor(address payable _pokeMe) PokeMeReady(_pokeMe) {
        owner = msg.sender;
    }

    // solhint-disable not-rely-on-time
    function increaseCount(uint256 amount)
        external
        onlyPokeMe
        onlyTaskCreator(owner)
    {
        require(
            ((block.timestamp - lastExecuted) > 180),
            "Counter: increaseCount: Time not elapsed"
        );

        count += amount;
        lastExecuted = block.timestamp;
    }
}
