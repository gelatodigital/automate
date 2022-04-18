// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

contract LibOps {
    /// @notice Helper func to query the _selector of a function you want to automate
    /// @param _func String of the function you want the selector from
    /// @dev Example: "transferFrom(address,address,uint256)" => 0x23b872dd
    function getSelector(string calldata _func) external pure returns (bytes4) {
        return bytes4(keccak256(bytes(_func)));
    }

    /// @notice Helper func to query the resolverHash
    /// @param _resolverAddress Address of resolver
    /// @param _resolverData Data passed to resolver
    function getResolverHash(
        address _resolverAddress,
        bytes memory _resolverData
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(_resolverAddress, _resolverData));
    }

    /// @notice Returns TaskId of a task Creator
    /// @param _taskCreator Address of the task creator
    /// @param _execAddress Address of the contract to be executed by Gelato
    /// @param _selector Function on the _execAddress which should be executed
    /// @param _useTaskTreasuryFunds If msg.sender's balance on TaskTreasury should pay for the tx
    /// @param _feeToken FeeToken to use, address 0 if task treasury is used
    /// @param _resolverHash hash of resolver address and data
    function getTaskId(
        address _taskCreator,
        address _execAddress,
        bytes4 _selector,
        bool _useTaskTreasuryFunds,
        address _feeToken,
        bytes32 _resolverHash
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    _taskCreator,
                    _execAddress,
                    _selector,
                    _useTaskTreasuryFunds,
                    _feeToken,
                    _resolverHash
                )
            );
    }
}
