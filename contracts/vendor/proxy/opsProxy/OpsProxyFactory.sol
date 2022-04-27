// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

import {OpsProxy} from "./OpsProxy.sol";
import {
    BeaconProxy
} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {Proxied} from "../EIP173/Proxied.sol";
import {
    Initializable
} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IOpsProxy} from "./interfaces/IOpsProxy.sol";
import {IOpsProxyFactory} from "./interfaces/IOpsProxyFactory.sol";
import {IBeacon} from "@openzeppelin/contracts/proxy/beacon/IBeacon.sol";

contract OpsProxyFactory is IOpsProxyFactory, IBeacon, Proxied, Initializable {
    uint256 public constant override version = 1;
    address public immutable ops;
    address public override implementation;

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

    modifier notProxy(address _account) {
        require(!isProxy(_account), "OpsProxyFactory: No proxy");
        _;
    }

    constructor(address _ops) {
        ops = _ops;
    }

    function initialize(address _implementation) external initializer {
        implementation = _implementation;
    }

    function updateBeaconImplementation(address _implementation)
        external
        override
        onlyProxyAdmin
    {
        address oldImplementation = implementation;
        implementation = _implementation;

        emit BeaconUpdated(oldImplementation, _implementation);
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

    function getOwnerOf(address _proxy)
        external
        view
        override
        returns (address)
    {
        require(isProxy(_proxy), "OpsProxyFactory: Not proxy");

        return IOpsProxy(_proxy).owner();
    }

    function deployFor(address owner)
        public
        override
        onlyOneProxy(owner)
        notProxy(owner)
        returns (address payable proxy)
    {
        bytes32 seed = _nextSeeds[tx.origin];

        bytes32 salt = keccak256(abi.encode(tx.origin, seed));

        bytes memory opsProxyInitializeData = abi.encodeWithSelector(
            IOpsProxy.initialize.selector,
            ops,
            owner
        );

        bytes memory bytecode = abi.encodePacked(
            type(BeaconProxy).creationCode,
            abi.encode(address(this), opsProxyInitializeData)
        );

        proxy = _deploy(salt, bytecode);

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

    function isProxy(address proxy) public view override returns (bool) {
        return _proxies[proxy];
    }

    function _deploy(bytes32 _salt, bytes memory _bytecode)
        internal
        returns (address payable proxy)
    {
        assembly {
            let endowment := 0
            let bytecodeStart := add(_bytecode, 0x20)
            let bytecodeLength := mload(_bytecode)
            proxy := create2(endowment, bytecodeStart, bytecodeLength, _salt)
        }
    }
}
