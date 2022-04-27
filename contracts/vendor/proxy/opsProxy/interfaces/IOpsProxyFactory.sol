// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

interface IOpsProxyFactory {
    /// @notice Events ///

    event DeployProxy(
        address indexed origin,
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

    function getNextSeed(address eoa) external view returns (bytes32);

    function getProxyOf(address account) external view returns (address);

    function getOwnerOf(address proxy) external view returns (address);

    function isProxy(address proxy) external view returns (bool);

    function version() external view returns (uint256);
}
