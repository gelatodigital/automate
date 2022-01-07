// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

abstract contract PokeMeReady {
    address payable public immutable pokeMe;

    modifier onlyPokeMe() {
        require(msg.sender == pokeMe, "PokeMeReady: onlyPokeMe");
        _;
    }

    constructor(address payable _pokeMe) {
        pokeMe = _pokeMe;
    }
}
