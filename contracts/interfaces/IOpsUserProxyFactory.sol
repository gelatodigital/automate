// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IOpsUserProxyFactory {
    /**
     * @notice Emitted when an OpsUserProxy is deployed.
     *
     * @param deployer Address which initiated the deployment
     * @param owner The address which the proxy is for.
     * @param seed Seed used for deployment.
     * @param salt Salt used for deployment.
     * @param proxy Address of deployed proxy.
     */
    event DeployProxy(
        address indexed deployer,
        address indexed owner,
        bytes32 seed,
        bytes32 salt,
        address proxy
    );

    /**
     * @notice Emitted when OpsUserProxy implementation is updated
     *
     * @param oldImplementation Previous implementation of OpsUserProxy
     * @param newImplementation Current implementation of OpsUserProxy
     */
    event BeaconUpdated(address oldImplementation, address newImplementation);

    /**
     * @notice Deploys OpsUserProxy for the msg.sender.
     *
     * @return proxy Address of deployed proxy.
     */
    function deploy() external returns (address payable proxy);

    /**
     * @notice Deploys OpsUserProxy for another address.
     *
     * @param owner Address to deploy the proxy for.
     *
     * @return proxy Address of deployed proxy.
     */
    function deployFor(address owner) external returns (address payable proxy);

    /**
     * @notice Update OpsUserProxy implementation
     *
     * @param implementation New OpsUserProxy implementation to be updated to.
     */
    function updateBeaconImplementation(address implementation) external;

    /**
     * @notice Determines the OpsUserProxy address when it is not deployed.
     *
     * @param account Address to determine the proxy address for.
     */
    function determineProxyAddress(address account)
        external
        view
        returns (address);

    /**
     * @return bytes32 Next seed which will be used for deployment for an address.
     */
    function getNextSeed(address account) external view returns (bytes32);

    /**
     * @return address Proxy address owned by account.
     * @return bool Whether if proxy is deployed
     */
    function getProxyOf(address account) external view returns (address, bool);

    /**
     * @return address Owner of deployed proxy.
     */
    function getOwnerOf(address proxy) external view returns (address);

    /**
     * @return bool Whether if a contract is an OpsUserProxy.
     */
    function isProxy(address proxy) external view returns (bool);

    /**
     * @return uint256 version of OpsUserProxyFactory.
     */
    function version() external view returns (uint256);
}
