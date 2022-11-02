// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {TaskModuleBase} from "./TaskModuleBase.sol";

contract ResolverModule is TaskModuleBase {
    /**
     * @notice Helper function to encode arguments for ResolverModule.
     *
     * @param _resolverAddress Address of resolver.
     * @param _resolverData Data passed to resolver.
     */
    function encodeModuleArg(
        address _resolverAddress,
        bytes calldata _resolverData
    ) external pure returns (bytes memory) {
        return abi.encode(_resolverAddress, _resolverData);
    }
}
