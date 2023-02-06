// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {TaskModuleBase} from "./TaskModuleBase.sol";
import {LibDataTypes} from "../libraries/LibDataTypes.sol";
import {_call} from "../functions/FExec.sol";

contract Web3FunctionModule is TaskModuleBase {
    /**
     * @notice Helper function to encode arguments for Web3FunctionModule.
     *
     * @param _web3FunctionHash IPFS hash of web3 function.
     * @param _web3FunctionArgsHex Arguments to be passed into web3 function in hex.
     */
    function encodeModuleArg(
        string memory _web3FunctionHash,
        bytes calldata _web3FunctionArgsHex
    ) external pure returns (bytes memory) {
        return abi.encode(_web3FunctionHash, _web3FunctionArgsHex);
    }
}
