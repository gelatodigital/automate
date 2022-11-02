// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.14;

import {CreatorBase} from "./CreatorBase.sol";

/**
 * @dev Inherit this contract to allow your smart contract
 * to create resolver tasks.
 *
 * onlyDedicatedMsgSender - Modifier to restrict function calls to task created by address(this).
 *
 * _createTask - Create a resolver task.
 * _cancelTask - Cancel a task created by address(this).
 *
 * NOTE Only applicable if task being created uses TaskTreasury (feeToken = address(0)).
 * depositFunds - Deposit funds into smart contract's gelato balance.
 * withdrawFunds - Owner can withdraw funds from smart contract's gelato balance.
 */
// solhint-disable max-line-length
abstract contract ResolverCreator is CreatorBase {
    // solhint-disable-next-line no-empty-blocks
    constructor(address _ops, address _owner) CreatorBase(_ops, _owner) {}

    /**
     * @param _execAddress Address of contract that should be called by Gelato.
     * @param _execSelector Selector of the function which Gelato will call.
     * @param _feeToken Address of token to be used as payment. Use address(0) if TaskTreasury is being used, 0xeeeeee... for ETH or native tokens.
     * @param _resolverAddress Address of resolver.
     * @param _resolverData Data passed to the resolver.
     *
     * @return taskId Unique hash of the task created.
     */
    function _createTask(
        address _execAddress,
        bytes memory _execSelector,
        address _feeToken,
        address _resolverAddress,
        bytes memory _resolverData
    ) internal returns (bytes32 taskId) {
        ModuleData memory moduleData = _resolverModuleData(
            _resolverAddress,
            _resolverData
        );

        taskId = _ops.createTask(
            _execAddress,
            _execSelector,
            moduleData,
            _feeToken
        );
    }

    function _resolverModuleData(
        address _resolverAddress,
        bytes memory _resolverData
    ) private pure returns (ModuleData memory) {
        Module[] memory modules = new Module[](2);
        modules[0] = Module.RESOLVER;
        modules[1] = Module.PROXY;

        bytes memory resolverModuleArg = abi.encode(
            _resolverAddress,
            _resolverData
        );

        bytes[] memory args = new bytes[](2);
        args[0] = resolverModuleArg;
        args[1] = bytes("");

        ModuleData memory moduleData = ModuleData(modules, args);

        return moduleData;
    }
}
