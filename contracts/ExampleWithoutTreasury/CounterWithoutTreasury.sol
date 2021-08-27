// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

import {PokeMeReady} from "./PokeMeReady.sol";

interface IPokeMe {
    function getFeeDetails() external view returns (uint256, address);
}

contract CounterWithoutTreasury is PokeMeReady {
    uint256 public count;
    uint256 public lastExecuted;

    // solhint-disable no-empty-blocks
    constructor(address _pokeMe) PokeMeReady(_pokeMe) {}

    receive() external payable {}

    // solhint-disable not-rely-on-time
    function increaseCount(uint256 amount) external onlyPokeMe {
        require(
            ((block.timestamp - lastExecuted) > 180),
            "Counter: increaseCount: Time not elapsed"
        );

        count += amount;
        lastExecuted = block.timestamp;

        uint256 fee;
        address feeToken;

        (fee, feeToken) = IPokeMe(pokeMe).getFeeDetails();

        _transfer(fee, feeToken);
    }
}
