// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Types.sol";

/**
 * @dev Inherit this contract to allow your smart contract to
 * - Make synchronous fee payments.
 * - Have call restrictions for functions to be automated.
 */
// solhint-disable private-vars-leading-underscore
abstract contract AutomateReady {
    IAutomate public immutable automate;
    address public immutable dedicatedMsgSender;
    address private immutable feeCollector;
    address internal constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    /**
     * @dev
     * Only tasks created by _taskCreator defined in constructor can call
     * the functions with this modifier.
     */
    modifier onlyDedicatedMsgSender() {
        require(msg.sender == dedicatedMsgSender, "Only dedicated msg.sender");
        _;
    }

    /**
     * @dev
     * _taskCreator is the address which will create tasks for this contract.
     */
    constructor(address _automate, address _taskCreator) {
        automate = IAutomate(_automate);
        IGelato gelato = IGelato(IAutomate(_automate).gelato());

        feeCollector = gelato.feeCollector();

        address proxyModuleAddress = IAutomate(_automate).taskModuleAddresses(
            Module.PROXY
        );

        address opsProxyFactoryAddress = IProxyModule(proxyModuleAddress)
            .opsProxyFactory();

        (dedicatedMsgSender, ) = IOpsProxyFactory(opsProxyFactoryAddress)
            .getProxyOf(_taskCreator);
    }

    /**
     * @dev
     * Transfers fee to gelato for synchronous fee payments.
     *
     * _fee & _feeToken should be queried from IAutomate.getFeeDetails()
     */
    function _transfer(uint256 _fee, address _feeToken) internal {
        if (_feeToken == ETH) {
            (bool success, ) = feeCollector.call{value: _fee}("");
            require(success, "_transfer: ETH transfer failed");
        } else {
            SafeERC20.safeTransfer(IERC20(_feeToken), feeCollector, _fee);
        }
    }

    function _getFeeDetails()
        internal
        view
        returns (uint256 fee, address feeToken)
    {
        (fee, feeToken) = automate.getFeeDetails();
    }
}
