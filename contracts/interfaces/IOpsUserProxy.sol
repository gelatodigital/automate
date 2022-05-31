// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IOpsUserProxy {
    /// @notice Events ///

    event ExecuteCall(
        address indexed target,
        bytes data,
        uint256 value,
        bytes returnData
    );

    event SetAdmin(address indexed account, bool isAdmin);

    /// @notice Constructor ///

    function initialize(address _ops, address _owner) external;

    /// @notice External functions ///

    function batchExecuteCall(
        address[] calldata _targets,
        bytes[] calldata _datas,
        uint256[] calldata _values
    ) external payable;

    function executeCall(
        address target,
        bytes calldata data,
        uint256 value
    ) external payable;

    /// @notice External view functions ///

    function ops() external view returns (address);

    function owner() external view returns (address);
}
