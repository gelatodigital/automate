// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.14;

import "./AutomateReadyUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @dev Inherit this contract to allow your upgradeable smart contract
 * to be a task creator and create tasks.
 */
//solhint-disable func-name-mixedcase
//solhint-disable const-name-snakecase
//solhint-disable no-empty-blocks
abstract contract AutomateTaskCreatorUpgradeable is AutomateReadyUpgradeable {
    using SafeERC20 for IERC20;

    IGelato1Balance public constant gelato1Balance =
        IGelato1Balance(0x7506C12a824d73D9b08564d5Afc22c949434755e);

    constructor(address _automate) AutomateReadyUpgradeable(_automate) {}

    function __AutomateTaskCreator_init() internal onlyInitializing {
        __AutomateReady_init(address(this));
    }

    function _depositFunds1Balance(
        uint256 _amount,
        address _token,
        address _sponsor
    ) internal {
        if (_token == ETH) {
            ///@dev Only deposit ETH on goerli for now.
            require(block.chainid == 5, "Only deposit ETH on goerli");
            gelato1Balance.depositNative{value: _amount}(_sponsor);
        } else {
            ///@dev Only deposit USDC on polygon for now.
            require(
                block.chainid == 137 &&
                    _token ==
                    address(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174),
                "Only deposit USDC on polygon"
            );
            IERC20(_token).approve(address(gelato1Balance), _amount);
            gelato1Balance.depositToken(_sponsor, _token, _amount);
        }
    }

    function _createTask(
        address _execAddress,
        bytes memory _execDataOrSelector,
        ModuleData memory _moduleData,
        address _feeToken
    ) internal returns (bytes32) {
        return
            automate.createTask(
                _execAddress,
                _execDataOrSelector,
                _moduleData,
                _feeToken
            );
    }

    function _cancelTask(bytes32 _taskId) internal {
        automate.cancelTask(_taskId);
    }

    function _resolverModuleArg(
        address _resolverAddress,
        bytes memory _resolverData
    ) internal pure returns (bytes memory) {
        return abi.encode(_resolverAddress, _resolverData);
    }

    function _proxyModuleArg() internal pure returns (bytes memory) {
        return bytes("");
    }

    function _singleExecModuleArg() internal pure returns (bytes memory) {
        return bytes("");
    }

    function _web3FunctionModuleArg(
        string memory _web3FunctionHash,
        bytes memory _web3FunctionArgsHex
    ) internal pure returns (bytes memory) {
        return abi.encode(_web3FunctionHash, _web3FunctionArgsHex);
    }

    function _timeTriggerModuleArg(uint128 _start, uint128 _interval)
        internal
        pure
        returns (bytes memory)
    {
        bytes memory triggerConfig = abi.encode(_start, _interval);

        return abi.encode(TriggerType.TIME, triggerConfig);
    }

    function _cronTriggerModuleArg(string memory _expression)
        internal
        pure
        returns (bytes memory)
    {
        bytes memory triggerConfig = abi.encode(_expression);

        return abi.encode(TriggerType.CRON, triggerConfig);
    }

    function _blockTriggerModuleArg() internal pure returns (bytes memory) {
        bytes memory triggerConfig = abi.encode(bytes(""));

        return abi.encode(TriggerType.BLOCK, triggerConfig);
    }
}
