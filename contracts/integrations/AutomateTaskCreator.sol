// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.14;

import "./AutomateReady.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @dev Inherit this contract to allow your smart contract
 * to be a task creator and create tasks.
 */
//solhint-disable const-name-snakecase
abstract contract AutomateTaskCreator is AutomateReady {
    using SafeERC20 for IERC20;

    address public immutable fundsOwner;
    IGelato1Balance public constant gelato1Balance =
        IGelato1Balance(0x7506C12a824d73D9b08564d5Afc22c949434755e);

    constructor(address _automate, address _fundsOwner)
        AutomateReady(_automate, address(this))
    {
        fundsOwner = _fundsOwner;
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

    function _timeModuleArg(uint256 _startTime, uint256 _interval)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encode(uint128(_startTime), uint128(_interval));
    }

    function _proxyModuleArg() internal pure returns (bytes memory) {
        return bytes("");
    }

    function _singleExecModuleArg() internal pure returns (bytes memory) {
        return bytes("");
    }

    function _web3FunctionModuleArg(
        string memory _web3FunctionHash,
        bytes calldata _web3FunctionArgsHex
    ) internal pure returns (bytes memory) {
        return abi.encode(_web3FunctionHash, _web3FunctionArgsHex);
    }
}
