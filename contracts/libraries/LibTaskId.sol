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
     * @notice Current way of computing taskId.
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
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    taskCreator,
                    execAddress,
                    execSelector,
                    moduleData,
                    feeToken
                )
            );
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
     * @notice Helper func to query the resolverHash
     *
     * @param resolverAddress Address of resolver
     * @param resolverData Data passed to resolver
     */
    function getResolverHash(address resolverAddress, bytes memory resolverData)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(resolverAddress, resolverData));
    }
}
