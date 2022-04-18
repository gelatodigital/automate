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

    event TransferOwnership(address indexed oldOwner, address indexed newOwner);

    event SetAdmin(address indexed account, bool isAdmin);

    /// @notice External functions ///

    function executeCall(
        address target,
        bytes calldata data,
        uint256 value
    ) external payable;

    function executeDelegateCall(address target, bytes calldata data) external;

    function setAdmin(address account, bool isAdmin) external;

    function transferOwnership(address newOwner) external;

    /// @notice External view functions ///

    function canCreateTask(address account) external view returns (bool);

    function ops() external view returns (address);

    function owner() external view returns (address);
}
