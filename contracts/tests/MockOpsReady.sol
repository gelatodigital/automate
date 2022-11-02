// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {
    SafeERC20,
    IERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

abstract contract MockOpsReady {
    IOps public immutable ops;
    address public immutable dedicatedMsgSender;

    address internal constant _ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    address private immutable _gelato;

    modifier onlyDedicatedMsgSender() {
        require(msg.sender == dedicatedMsgSender, "Only dedicated msg.sender");
        _;
    }

    constructor(
        address _ops,
        address _opsProxyFactory,
        address _taskCreator
    ) {
        ops = IOps(_ops);
        _gelato = IOps(_ops).gelato();
        (dedicatedMsgSender, ) = IOpsProxyFactory(_opsProxyFactory).getProxyOf(
            _taskCreator
        );
    }

    function _transfer(uint256 _amount, address _paymentToken) internal {
        if (_paymentToken == _ETH) {
            (bool success, ) = _gelato.call{value: _amount}("");
            require(success, "_transfer: ETH transfer failed");
        } else {
            SafeERC20.safeTransfer(IERC20(_paymentToken), _gelato, _amount);
        }
    }
}

interface IOps {
    function gelato() external view returns (address payable);

    function getFeeDetails() external view returns (uint256, address);
}

interface IOpsProxyFactory {
    function getProxyOf(address account) external view returns (address, bool);
}
