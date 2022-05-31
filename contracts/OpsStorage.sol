// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {LibDataTypes} from "./libraries/LibDataTypes.sol";

// solhint-disable max-states-count
abstract contract OpsStorage {
    mapping(bytes32 => address) public taskCreator;
    mapping(bytes32 => address) public execAddresses;
    mapping(address => EnumerableSet.Bytes32Set) internal _createdTasks;

    uint256 public fee;
    address public feeToken;

    // Appended State
    mapping(bytes32 => LibDataTypes.Time) public timedTask;
    mapping(LibDataTypes.Module => address) public taskModuleAddresses;
}
