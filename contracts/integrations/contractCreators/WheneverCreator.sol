// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.14;

import {CreatorBase} from "./CreatorBase.sol";

/**
 * @dev Inherit this contract to allow your smart contract
 * to create whenever possible tasks.
 *
 * onlyDedicatedMsgSender - Modifier to restrict function calls to task created by address(this).
 *
 * _createTask - Create a whenever possible task.
 * _cancelTask - Cancel a task created by address(this).
 *
 * NOTE Only applicable if task being created uses TaskTreasury (feeToken = address(0)).
 * depositFunds - Deposit funds into smart contract's gelato balance.
 * withdrawFunds - Owner can withdraw funds from smart contract's gelato balance.
 */
// solhint-disable max-line-length
abstract contract WheneverCreator is CreatorBase {
    // solhint-disable-next-line no-empty-blocks
    constructor(address _ops, address _owner) CreatorBase(_ops, _owner) {}

    /**
     * @param _execAddress Address of contract that should be called by Gelato.
     * @param _execData Execution data to be called with by Gelato.
     * @param _feeToken Address of token to be used as payment. Use address(0) if TaskTreasury is being used, 0xeeeeee... for ETH or native tokens.     *
     * @return taskId Unique hash of the task created.
     */
    function _createTask(
        address _execAddress,
        bytes memory _execData,
        address _feeToken
    ) internal returns (bytes32 taskId) {
        ModuleData memory moduleData = _wheneverModuleData();

        taskId = _ops.createTask(
            _execAddress,
            _execData,
            moduleData,
            _feeToken
        );
    }

    function _wheneverModuleData() private pure returns (ModuleData memory) {
        Module[] memory modules = new Module[](1);
        modules[0] = Module.PROXY;

        bytes[] memory args = new bytes[](1);
        args[0] = bytes("");

        ModuleData memory moduleData = ModuleData(modules, args);

        return moduleData;
    }
}
