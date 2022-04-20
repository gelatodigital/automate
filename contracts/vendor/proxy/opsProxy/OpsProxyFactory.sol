// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

import {OpsProxy} from "./OpsProxy.sol";
import {IOpsProxy} from "./interfaces/IOpsProxy.sol";
import {IOpsProxyFactory} from "./interfaces/IOpsProxyFactory.sol";

contract OpsProxyFactory is IOpsProxyFactory {
    uint256 public constant override version = 1;
    address public immutable ops;

    /// @dev track the next seed to be used by an EOA.
    mapping(address => bytes32) internal _nextSeeds;

    /// @dev track deployed proxies
    mapping(address => bool) internal _proxies;

    /// @dev track proxy of user
    mapping(address => address) internal _proxyOf;

    modifier onlyOneProxy(address _account) {
        require(
            _proxyOf[_account] == address(0),
            "OpsProxyFactory: Owns proxy"
        );
        _;
    }

    constructor(address _ops) {
        ops = _ops;
    }

    function deploy() external override returns (address payable proxy) {
        proxy = deployFor(msg.sender);
    }

    function getNextSeed(address _eoa)
        external
        view
        override
        returns (bytes32)
    {
        return _nextSeeds[_eoa];
    }

    function getProxyOf(address _account)
        external
        view
        override
        returns (address)
    {
        return _proxyOf[_account];
    }

    function isProxy(address proxy) external view override returns (bool) {
        return _proxies[proxy];
    }

    function deployFor(address owner)
        public
        override
        onlyOneProxy(owner)
        returns (address payable proxy)
    {
        bytes32 seed = _nextSeeds[tx.origin];

        bytes32 salt = keccak256(abi.encode(tx.origin, seed));

        bytes memory bytecode = abi.encodePacked(
            type(OpsProxy).creationCode,
            abi.encode(ops, owner)
        );

        assembly {
            let endowment := 0
            let bytecodeStart := add(bytecode, 0x20)
            let bytecodeLength := mload(bytecode)
            proxy := create2(endowment, bytecodeStart, bytecodeLength, salt)
        }

        _proxies[proxy] = true;
        _proxyOf[owner] = proxy;

        unchecked {
            _nextSeeds[tx.origin] = bytes32(uint256(seed) + 1);
        }

        emit DeployProxy(
            tx.origin,
            msg.sender,
            owner,
            seed,
            salt,
            address(proxy)
        );
    }
}
