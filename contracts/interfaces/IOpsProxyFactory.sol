// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IOpsProxyFactory {
    /**
     * @notice Emitted when an OpsProxy is deployed.
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
     * @notice Deploys OpsProxy for the msg.sender.
     *
     * @return proxy Address of deployed proxy.
     */
    function deploy() external returns (address payable proxy);

    /**
     * @notice Deploys OpsProxy for another address.
     *
     * @param owner Address to deploy the proxy for.
     *
     * @return proxy Address of deployed proxy.
     */
    function deployFor(address owner) external returns (address payable proxy);

    /**
     * @notice Determines the OpsProxy address when it is not deployed.
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
     * @return bool Whether if a contract is an OpsProxy.
     */
    function isProxy(address proxy) external view returns (bool);

    /**
     * @return uint256 version of OpsProxyFactory.
     */
    function version() external view returns (uint256);
}
