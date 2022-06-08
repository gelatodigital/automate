// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {LibDataTypes} from "./libraries/LibDataTypes.sol";

/**
 * @notice Storage layout of Ops smart contract.
 */
// solhint-disable max-states-count
abstract contract OpsStorage {
    mapping(bytes32 => address) public taskCreator; ///@dev Deprecated
    mapping(bytes32 => address) public execAddresses; ///@dev Deprecated
    mapping(address => EnumerableSet.Bytes32Set) internal _createdTasks;

    uint256 public fee;
    address public feeToken;

    ///@dev Appended State
    mapping(bytes32 => LibDataTypes.Time) public timedTask;
    mapping(LibDataTypes.Module => address) public taskModuleAddresses;
}
