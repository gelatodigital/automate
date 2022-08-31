// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {TaskModuleBase} from "./TaskModuleBase.sol";
import {LibDataTypes} from "../libraries/LibDataTypes.sol";
import {_call} from "../functions/FExec.sol";

contract OResolverModule is TaskModuleBase, Ownable {
    bool public whitelistEnabled;
    mapping(address => bool) public whitelisted;

    constructor() {
        whitelistEnabled = true;
    }

    /**
     * @dev calls OResolverModule to check if task creator is whitelisted.
     * whitelist state lives in OResolverModule and not on Ops.
     */
    function onCreateTask(
        bytes32,
        address _taskCreator,
        address,
        bytes calldata,
        bytes calldata
    ) external override {
        address addressThis = taskModuleAddresses[
            LibDataTypes.Module.ORESOLVER
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
     * OResolver task only if whitelistEnabled is set to true.
     */
    function onlyWhitelisted(address _taskCreator) external view {
        if (whitelistEnabled)
            require(
                whitelisted[_taskCreator],
                "OResolverModule: Not whitelisted"
            );
    }

    /**
     * @notice Helper function to encode arguments for OResolverModule.
     *
     * @param _offChainResolverHash IPFS hash of off-chain resolver.
     * @param _offChainResolverArgsHex off-chain resolver `checker` arguments in hex.
     */
    function encodeModuleArg(
        string memory _offChainResolverHash,
        bytes calldata _offChainResolverArgsHex
    ) external pure returns (bytes memory) {
        return abi.encode(_offChainResolverHash, _offChainResolverArgsHex);
    }
}
