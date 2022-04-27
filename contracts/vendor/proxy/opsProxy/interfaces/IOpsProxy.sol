// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

interface IOpsProxy {
    /// @notice Events ///

    event ExecuteCall(
        address indexed target,
        bytes data,
        uint256 value,
        bytes returnData
    );

    event ExecuteDelegateCall(
        address indexed target,
        bytes data,
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

    function executeDelegateCall(address target, bytes calldata data) external;

    function setAdmin(address account, bool isAdmin) external;

    /// @notice External view functions ///

    function admins(address account) external view returns (bool);

    function ops() external view returns (address);

    function owner() external view returns (address);
}
