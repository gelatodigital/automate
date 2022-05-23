// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {DataTypes} from "../libraries/DataTypes.sol";
import {ITaskTreasuryUpgradable} from "./ITaskTreasuryUpgradable.sol";
import {
    IOpsProxyFactory
} from "../vendor/proxy/opsProxy/interfaces/IOpsProxyFactory.sol";

interface IOps {
    /// @notice External functions ///

    function createTask(
        address _execAddress,
        bytes4 _execSelector,
        address _resolverAddress,
        bytes calldata _resolverData,
        address _feeToken,
        DataTypes.Modules[] calldata _taskModules,
        bytes[] calldata _taskModuleArgs
    ) external returns (bytes32 taskId);

    function cancelTask(bytes32 _taskId) external;

    function exec(
        uint256 _txFee,
        address _feeToken,
        address _taskCreator,
        bool _useTaskTreasuryFunds,
        bool _revertOnFailure,
        bytes32 _resolverHash,
        address _execAddress,
        bytes calldata _execData
    ) external;

    /// @notice External view functions ///

    function getFeeDetails() external view returns (uint256, address);

    function getTaskIdsByUser(address _taskCreator)
        external
        view
        returns (bytes32[] memory);
}
