// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IOpsProxy {
    /**
     * @notice Emitted when proxy calls a contract successfully in `executeCall`
     *
     * @param target Address of contract that is called
     * @param data Data used in the call.
     * @param value Native token value used in the call.
     * @param returnData Data returned by the call.
     */
    event ExecuteCall(
        address indexed target,
        bytes data,
        uint256 value,
        bytes returnData
    );

    /**
     * @notice Multicall to different contracts with different datas.
     *
     * @param targets Addresses of contracts to be called.
     * @param datas Datas for each contract call.
     * @param values Native token value for each contract call.
     */
    function batchExecuteCall(
        address[] calldata targets,
        bytes[] calldata datas,
        uint256[] calldata values
    ) external payable;

    /**
     * @notice Call to a single contract.
     *
     * @param target Address of contracts to be called.
     * @param data Data for contract call.
     * @param value Native token value for contract call.
     */
    function executeCall(
        address target,
        bytes calldata data,
        uint256 value
    ) external payable;

    /**
     * @return address Ops smart contract address
     */
    function ops() external view returns (address);

    /**
     * @return address Owner of the proxy
     */
    function owner() external view returns (address);

    /**
     * @return uint256 version of OpsProxy.
     */
    function version() external view returns (uint256);
}
