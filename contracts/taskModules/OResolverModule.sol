// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {TaskModuleBase} from "./TaskModuleBase.sol";

contract OResolverModule is TaskModuleBase {
    /**
     * @notice Helper function to encode arguments for OResolverModule.
     *
     * @param _offChainResolverHash IPFS hash of off-chain resolver.
     * @param _offChainResolverArgsHex off-chain resolver `checker` arguments in hex.
     */
    function encodeModuleArg(
        string memory _offChainResolverHash,
        bytes calldata _offChainResolverArgsHex
    ) external pure returns (bytes memory) {
        return abi.encode(_offChainResolverHash, _offChainResolverArgsHex);
    }
}
