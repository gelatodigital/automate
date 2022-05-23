// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {DataTypes} from "./libraries/DataTypes.sol";
import {
    ITaskTreasuryUpgradable
} from "./interfaces/ITaskTreasuryUpgradable.sol";
import {
    IOpsProxyFactory
} from "./vendor/proxy/opsProxy/interfaces/IOpsProxyFactory.sol";

// solhint-disable const-name-snakecase
// solhint-disable max-states-count
abstract contract OpsStorage {
    string public constant version = "4";
    ITaskTreasuryUpgradable public immutable taskTreasury;
    IOpsProxyFactory public immutable opsProxyFactory;

    mapping(bytes32 => address) public taskCreator;
    mapping(bytes32 => address) public execAddresses;
    mapping(address => EnumerableSet.Bytes32Set) internal _createdTasks;

    uint256 public fee;
    address public feeToken;

    // Appended State
    mapping(bytes32 => DataTypes.Time) public timedTask;
    mapping(bytes32 => DataTypes.SingleExec) public singleExecTask;

    constructor(address _taskTreasury, address _opsProxyFactory) {
        taskTreasury = ITaskTreasuryUpgradable(_taskTreasury);
        opsProxyFactory = IOpsProxyFactory(_opsProxyFactory);
    }
}
