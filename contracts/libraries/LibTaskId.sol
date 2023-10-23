// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {LibDataTypes} from "./LibDataTypes.sol";

/**
 * @notice Library to compute taskId of tasks.
 */
// solhint-disable max-line-length
library LibTaskId {
    /**
     * @notice Returns taskId of taskCreator.
     *
     * @param taskCreator The address which created the task.
     * @param execAddress Address of contract that will be called by Gelato.
     * @param execSelector Signature of the function which will be called by Gelato.
     * @param moduleData  Conditional modules that will be used. {See LibDataTypes-ModuleData}
     * @param feeToken Address of token to be used as payment. Use address(0) if Gelato 1Balance is being used, 0xeeeeee... for ETH or native tokens.
     */
    function getTaskId(
        address taskCreator,
        address execAddress,
        bytes4 execSelector,
        LibDataTypes.ModuleData memory moduleData,
        address feeToken
    ) internal pure returns (bytes32 taskId) {
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
