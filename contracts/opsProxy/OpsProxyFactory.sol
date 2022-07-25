// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {
    EIP173NonTransferableWithCustomReceive
} from "../vendor/proxy/EIP173/EIP173NonTransferableWithCustomReceive.sol";
import {OpsProxy} from "./OpsProxy.sol";
import {IOpsProxy} from "../interfaces/IOpsProxy.sol";
import {IOpsProxyFactory} from "../interfaces/IOpsProxyFactory.sol";

// solhint-disable max-states-count
contract OpsProxyFactory is IOpsProxyFactory {
    // solhint-disable const-name-snakecase
    uint256 public constant override version = 1;
    address public immutable ops;
    address public immutable implementation;

    ///@dev track the next seed to be used by an EOA.
    mapping(address => bytes32) internal _nextSeeds;

    ///@dev track deployed proxies
    mapping(address => bool) internal _proxies;

    ///@dev track proxy of user
    mapping(address => address) internal _proxyOf;

    ///@dev track owner of proxy
    mapping(address => address) internal _ownerOf;

    modifier onlyOneProxy(address _account) {
        require(_proxyOf[_account] == address(0), "OpsProxyFactory: One proxy");
        _;
    }

    modifier notProxy(address _account) {
        require(!isProxy(_account), "OpsProxyFactory: No proxy");
        _;
    }

    constructor(address _ops, address _implementation) {
        ops = _ops;
        implementation = _implementation;
    }

    ///@inheritdoc IOpsProxyFactory
    function deploy() external override returns (address payable proxy) {
        proxy = deployFor(msg.sender);
    }

    ///@inheritdoc IOpsProxyFactory
    function getNextSeed(address _account)
        external
        view
        override
        returns (bytes32)
    {
        return _nextSeeds[_account];
    }

    ///@inheritdoc IOpsProxyFactory
    function getProxyOf(address _account)
        external
        view
        override
        returns (address, bool)
    {
        address proxyAddress = _proxyOf[_account];

        if (proxyAddress != address(0)) return (proxyAddress, true);

        proxyAddress = determineProxyAddress(_account);
        return (proxyAddress, false);
    }

    ///@inheritdoc IOpsProxyFactory
    function getOwnerOf(address _proxy)
        external
        view
        override
        returns (address)
    {
        require(isProxy(_proxy), "OpsProxyFactory: Not proxy");

        return _ownerOf[_proxy];
    }

    ///@inheritdoc IOpsProxyFactory
    function deployFor(address owner)
        public
        override
        onlyOneProxy(owner)
        notProxy(owner)
        returns (address payable proxy)
    {
        (bytes32 seed, bytes32 salt) = _getSeedAndSalt(owner);

        bytes memory bytecode = _getBytecode(owner);

        proxy = _deploy(salt, bytecode);

        _proxies[proxy] = true;
        _proxyOf[owner] = proxy;
        _ownerOf[proxy] = owner;

        unchecked {
            _nextSeeds[owner] = bytes32(uint256(seed) + 1);
        }

        emit DeployProxy(msg.sender, owner, seed, salt, address(proxy));
    }

    ///@inheritdoc IOpsProxyFactory
    function determineProxyAddress(address _account)
        public
        view
        override
        returns (address)
    {
        address proxyAddress = _proxyOf[_account];
        if (proxyAddress != address(0)) return proxyAddress;

        (, bytes32 salt) = _getSeedAndSalt(_account);

        bytes memory bytecode = _getBytecode(_account);

        bytes32 codeHash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            )
        );

        return address(uint160(uint256(codeHash)));
    }

    ///@inheritdoc IOpsProxyFactory
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

    function _getSeedAndSalt(address _account)
        internal
        view
        returns (bytes32 seed, bytes32 salt)
    {
        seed = _nextSeeds[_account];

        salt = keccak256(abi.encode(_account, seed));
    }

    function _getBytecode(address _owner) internal view returns (bytes memory) {
        return
            abi.encodePacked(
                type(EIP173NonTransferableWithCustomReceive).creationCode,
                abi.encode(implementation, _owner, bytes(""))
            );
    }
}
