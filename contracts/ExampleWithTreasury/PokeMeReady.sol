// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

abstract contract PokeMeReady {
    address payable public immutable pokeMe;

    modifier onlyPokeMe() {
        require(msg.sender == pokeMe, "PokeMeReady: onlyPokeMe");
        _;
    }

    modifier onlyTaskCreator(address _taskCreator) {
        address taskCreator;

        assembly {
            taskCreator := shr(96, calldataload(sub(calldatasize(), 20)))
        }

        require(
            taskCreator == _taskCreator,
            "Execution not from creator's task"
        );

        _;
    }

    constructor(address payable _pokeMe) {
        pokeMe = _pokeMe;
    }
}
