// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

import {PokeMeReady} from "./PokeMeReady.sol";

contract CounterTimedTask is PokeMeReady {
    uint256 public count;
    bool public executable;

    // solhint-disable-next-line no-empty-blocks
    constructor(address payable _pokeMe) PokeMeReady(_pokeMe) {}

    // solhint-disable not-rely-on-time
    function increaseCount(uint256 amount) external onlyPokeMe {
        require(executable, "CounterTimedTask: increaseCount: Not executable");

        count += amount;
    }

    function setExecutable(bool _executable) external {
        executable = _executable;
    }
}
