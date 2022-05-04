// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IOpsProxyFactory {
    /// @notice Events ///

    event DeployProxy(
        address indexed deployer,
        address indexed owner,
        bytes32 seed,
        bytes32 salt,
        address proxy
    );

    event BeaconUpdated(address oldImplementation, address newImplementation);

    /// @notice External functions ///

    function deploy() external returns (address payable proxy);

    function deployFor(address owner) external returns (address payable proxy);

    function updateBeaconImplementation(address implementation) external;

    /// @notice External view functions ///

    function determineProxyAddress(address _account)
        external
        view
        returns (address);

    function getNextSeed(address account) external view returns (bytes32);

    function getProxyOf(address account) external view returns (address, bool);

    function getOwnerOf(address proxy) external view returns (address);

    function isProxy(address proxy) external view returns (bool);

    function version() external view returns (uint256);
}
