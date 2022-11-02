// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "./Proxy.sol";
import {IOpsProxyFactory} from "../../../interfaces/IOpsProxyFactory.sol";

interface ERC165 {
    function supportsInterface(bytes4 id) external view returns (bool);
}

/**
 * @notice Proxy implementing EIP173 for ownership management.
 * @notice This is used for OpsProxy.
 *
 * @dev 1. custom receive can be set in implementation.
 * @dev 2. transferProxyAdmin removed.
 * @dev 3. implementation can only be set to those whitelisted on OpsProxyFactory.
 */
contract EIP173OpsProxy is Proxy {
    // ////////////////////////// STATES ///////////////////////////////////////////////////////////////////////
    IOpsProxyFactory public immutable opsProxyFactory;

    // ////////////////////////// EVENTS ///////////////////////////////////////////////////////////////////////

    event ProxyAdminTransferred(
        address indexed previousAdmin,
        address indexed newAdmin
    );

    // /////////////////////// MODIFIERS //////////////////////////////////////////////////////////////////////
    modifier onlyWhitelistedImplementation(address _implementation) {
        require(
            opsProxyFactory.whitelistedImplementations(_implementation),
            "Implementation not whitelisted"
        );
        _;
    }

    // /////////////////////// FALLBACKS //////////////////////////////////////////////////////////////////////
    receive() external payable override {
        _fallback();
    }

    // /////////////////////// CONSTRUCTOR //////////////////////////////////////////////////////////////////////

    constructor(
        address _opsProxyFactory,
        address implementationAddress,
        address adminAddress,
        bytes memory data
    ) payable {
        opsProxyFactory = IOpsProxyFactory(_opsProxyFactory);
        _setImplementation(implementationAddress, data);
        _setProxyAdmin(adminAddress);
    }

    // ///////////////////// EXTERNAL ///////////////////////////////////////////////////////////////////////////

    function proxyAdmin() external view returns (address) {
        return _proxyAdmin();
    }

    function supportsInterface(bytes4 id) external view returns (bool) {
        if (id == 0x01ffc9a7 || id == 0x7f5828d0) {
            return true;
        }
        if (id == 0xFFFFFFFF) {
            return false;
        }

        ERC165 implementation;
        // solhint-disable-next-line security/no-inline-assembly
        assembly {
            implementation := sload(
                0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
            )
        }

        // Technically this is not standard compliant as ERC-165 require 30,000 gas which that call cannot ensure
        // because it is itself inside `supportsInterface` that might only get 30,000 gas.
        // In practise this is unlikely to be an issue.
        try implementation.supportsInterface(id) returns (bool support) {
            return support;
        } catch {
            return false;
        }
    }

    function upgradeTo(address newImplementation)
        external
        onlyProxyAdmin
        onlyWhitelistedImplementation(newImplementation)
    {
        _setImplementation(newImplementation, "");
    }

    function upgradeToAndCall(address newImplementation, bytes calldata data)
        external
        payable
        onlyProxyAdmin
        onlyWhitelistedImplementation(newImplementation)
    {
        _setImplementation(newImplementation, data);
    }

    // /////////////////////// MODIFIERS ////////////////////////////////////////////////////////////////////////

    modifier onlyProxyAdmin() {
        require(msg.sender == _proxyAdmin(), "NOT_AUTHORIZED");
        _;
    }

    // ///////////////////////// INTERNAL //////////////////////////////////////////////////////////////////////

    function _proxyAdmin() internal view returns (address adminAddress) {
        // solhint-disable-next-line security/no-inline-assembly
        assembly {
            adminAddress := sload(
                0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103
            )
        }
    }

    function _setProxyAdmin(address newAdmin) internal {
        address previousAdmin = _proxyAdmin();
        // solhint-disable-next-line security/no-inline-assembly
        assembly {
            sstore(
                0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103,
                newAdmin
            )
        }
        emit ProxyAdminTransferred(previousAdmin, newAdmin);
    }
}
