// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {TaskModuleBase} from "./TaskModuleBase.sol";
import {LibDataTypes} from "../libraries/LibDataTypes.sol";
import {_call} from "../functions/FExec.sol";

contract Web3FunctionModule is TaskModuleBase, Ownable {
    bool public whitelistEnabled;
    mapping(address => bool) public whitelisted;

    constructor() {
        whitelistEnabled = true;
    }

    /**
     * @dev calls Web3FunctionModule to check if task creator is whitelisted.
     * whitelist state lives in Web3FunctionModule and not on Ops.
     */
    function onCreateTask(
        bytes32,
        address _taskCreator,
        address,
        bytes calldata,
        bytes calldata
    ) external override {
        address addressThis = taskModuleAddresses[
            LibDataTypes.Module.WEB3_FUNCTION
        ];

        bytes memory callData = abi.encodeWithSelector(
            this.onlyWhitelisted.selector,
            _taskCreator
        );

        _call(addressThis, callData, 0, true, "");
    }

    function setWhitelist(address[] memory _taskCreators, bool _whitelist)
        external
        onlyOwner
    {
        uint256 length = _taskCreators.length;
        for (uint256 i; i < length; i++)
            whitelisted[_taskCreators[i]] = _whitelist;
    }

    function setWhitelistEnabled(bool _enabled) external onlyOwner {
        whitelistEnabled = _enabled;
    }

    /**
     * @dev Requires taskCreator to be whitelisted to create an
     * Web3Function task only if whitelistEnabled is set to true.
     */
    function onlyWhitelisted(address _taskCreator) external view {
        if (whitelistEnabled)
            require(
                whitelisted[_taskCreator],
                "Web3FunctionModule: Not whitelisted"
            );
    }

    /**
     * @notice Helper function to encode arguments for Web3FunctionModule.
     *
     * @param _web3FunctionHash IPFS hash of web3 function.
     * @param _web3FunctionArgsHex Arguments to be passed into web3 function in hex.
     */
    function encodeModuleArg(
        string memory _web3FunctionHash,
        bytes calldata _web3FunctionArgsHex
    ) external pure returns (bytes memory) {
        return abi.encode(_web3FunctionHash, _web3FunctionArgsHex);
    }
}
