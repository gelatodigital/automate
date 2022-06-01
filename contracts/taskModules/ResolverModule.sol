// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.12;

import {TaskModuleBase} from "./TaskModuleBase.sol";
import {LibEvents} from "../libraries/LibEvents.sol";

contract ResolverModule is TaskModuleBase {
    function encodeModuleArg(
        address _resolverAddress,
        bytes calldata _resolverData
    ) external pure returns (bytes memory) {
        return abi.encode(_resolverAddress, _resolverData);
    }
}
