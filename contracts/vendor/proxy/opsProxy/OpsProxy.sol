// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

import {GelatoBytes} from "../../gelato/GelatoBytes.sol";
import {IOpsProxy} from "./interfaces/IOpsProxy.sol";

contract OpsProxy is IOpsProxy {
    using GelatoBytes for bytes;

    address public immutable override ops;
    address public override owner;

    /// @dev track admins of proxy
    mapping(address => bool) internal _admins;

    modifier onlyAuth() {
        require(
            msg.sender == ops || canCreateTask(msg.sender),
            "OpsProxy: Not authorised"
        );
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "OpsProxy: Not Owner");
        _;
    }

    modifier onlyContract(address _addr) {
        require(_addr.code.length > 0, "OpsProxy: Not Contract");
        _;
    }

    constructor(address _ops) {
        ops = _ops;
        owner = msg.sender;
        emit TransferOwnership(address(0), msg.sender);
    }

    receive() external payable {}

    function executeCall(
        address _target,
        bytes calldata _data,
        uint256 _value
    ) external payable override onlyAuth onlyContract(_target) {
        (bool success, bytes memory returndata) = _target.call{value: _value}(
            _data
        );

        emit ExecuteCall(_target, _data, _value, returndata);

        if (!success) returndata.revertWithError("OpsProxy: _callTo: ");
    }

    function executeDelegateCall(address _target, bytes calldata _data)
        external
        override
        onlyAuth
        onlyContract(_target)
    {
        (bool success, bytes memory returndata) = _target.delegatecall(_data);

        emit ExecuteDelegateCall(_target, _data, returndata);

        if (!success) returndata.revertWithError("OpsProxy: _delegateCallTo: ");
    }

    function transferOwnership(address _newOwner) external override onlyOwner {
        owner = _newOwner;

        emit TransferOwnership(owner, _newOwner);
    }

    function setAdmin(address _account, bool _isAdmin)
        external
        override
        onlyOwner
    {
        _admins[_account] = _isAdmin;

        emit SetAdmin(_account, _isAdmin);
    }

    /// @dev called by Ops to check if the user creating task has permission
    function canCreateTask(address _account)
        public
        view
        override
        returns (bool)
    {
        return
            _account == owner || _admins[_account] || _account == address(this);
    }
}
