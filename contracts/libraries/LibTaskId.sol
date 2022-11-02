// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {LibDataTypes} from "./LibDataTypes.sol";

/**
 * @notice Library to compute taskId of legacy and current tasks.
 */
// solhint-disable max-line-length
library LibTaskId {
    /**
     * @notice Returns taskId of taskCreator.
     * @notice To maintain the taskId of legacy tasks, if
     * resolver module or resolver and time module is used,
     * we will compute task id the legacy way.
     *
     * @param taskCreator The address which created the task.
     * @param execAddress Address of contract that will be called by Gelato.
     * @param execSelector Signature of the function which will be called by Gelato.
     * @param moduleData  Conditional modules that will be used. {See LibDataTypes-ModuleData}
     * @param feeToken Address of token to be used as payment. Use address(0) if TaskTreasury is being used, 0xeeeeee... for ETH or native tokens.
     */
    function getTaskId(
        address taskCreator,
        address execAddress,
        bytes4 execSelector,
        LibDataTypes.ModuleData memory moduleData,
        address feeToken
    ) internal pure returns (bytes32 taskId) {
        if (_shouldGetLegacyTaskId(moduleData.modules)) {
            bytes32 resolverHash = _getResolverHash(moduleData.args[0]);

            taskId = getLegacyTaskId(
                taskCreator,
                execAddress,
                execSelector,
                feeToken == address(0),
                feeToken,
                resolverHash
            );
        } else {
            taskId = keccak256(
                abi.encode(
                    taskCreator,
                    execAddress,
                    execSelector,
                    moduleData,
                    feeToken
                )
            );
        }
    }

    /**
     * @notice Returns taskId of taskCreator.
     * @notice Legacy way of computing taskId.
     *
     * @param taskCreator The address which created the task.
     * @param execAddress Address of contract that will be called by Gelato.
     * @param execSelector Signature of the function which will be called by Gelato.
     * @param useTaskTreasuryFunds Wether fee should be deducted from TaskTreasury.
     * @param feeToken Address of token to be used as payment. Use address(0) if TaskTreasury is being used, 0xeeeeee... for ETH or native tokens.
     * @param resolverHash Hash of resolverAddress and resolverData {See getResolverHash}
     */
    function getLegacyTaskId(
        address taskCreator,
        address execAddress,
        bytes4 execSelector,
        bool useTaskTreasuryFunds,
        address feeToken,
        bytes32 resolverHash
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    taskCreator,
                    execAddress,
                    execSelector,
                    useTaskTreasuryFunds,
                    feeToken,
                    resolverHash
                )
            );
    }

    /**
     * @dev For legacy tasks, resolvers are compulsory. Time tasks were also introduced.
     * The sequence of Module is enforced in {LibTaskModule-_validModules}
     */
    function _shouldGetLegacyTaskId(LibDataTypes.Module[] memory _modules)
        private
        pure
        returns (bool)
    {
        uint256 length = _modules.length;

        if (
            (length == 1 && _modules[0] == LibDataTypes.Module.RESOLVER) ||
            (length == 2 &&
                _modules[0] == LibDataTypes.Module.RESOLVER &&
                _modules[1] == LibDataTypes.Module.TIME)
        ) return true;

        return false;
    }

    /**
     * @dev Acquire resolverHash which is required to compute legacyTaskId.
     *
     * @param _resolverModuleArg Encoded value of resolverAddress and resolverData
     */
    function _getResolverHash(bytes memory _resolverModuleArg)
        private
        pure
        returns (bytes32)
    {
        return keccak256(_resolverModuleArg);
    }
}
