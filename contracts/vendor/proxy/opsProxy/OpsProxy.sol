// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

import {GelatoBytes} from "../../gelato/GelatoBytes.sol";
import {IOpsProxy} from "./interfaces/IOpsProxy.sol";
import {
    Initializable
} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract OpsProxy is IOpsProxy, Initializable {
    using GelatoBytes for bytes;

    address public override ops;
    address public override owner;

    /// @dev track admins of proxy
    mapping(address => bool) internal _admins;

    modifier onlyAuth() {
        require(
            msg.sender == ops ||
                msg.sender == owner ||
                _admins[msg.sender] ||
                msg.sender == address(this),
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

    receive() external payable {}

    function initialize(address _ops, address _owner) external initializer {
        ops = _ops;
        owner = _owner;
    }

    function setAdmin(address _account, bool _isAdmin)
        external
        override
        onlyOwner
    {
        _admins[_account] = _isAdmin;

        emit SetAdmin(_account, _isAdmin);
    }

    function admins(address _account) external view override returns (bool) {
        return _admins[_account];
    }

    function batchExecuteCall(
        address[] calldata _targets,
        bytes[] calldata _datas,
        uint256[] calldata _values
    ) public payable override onlyAuth {
        uint256 length = _targets.length;
        require(
            length == _datas.length && length == _values.length,
            "OpsProxy: Length mismatch"
        );

        for (uint256 i; i < length; i++)
            executeCall(_targets[i], _datas[i], _values[i]);
    }

    function executeCall(
        address _target,
        bytes calldata _data,
        uint256 _value
    ) public payable override onlyAuth onlyContract(_target) {
        (bool success, bytes memory returndata) = _target.call{value: _value}(
            _data
        );

        if (!success) returndata.revertWithError("OpsProxy: _callTo: ");

        emit ExecuteCall(_target, _data, _value, returndata);
    }

    function executeDelegateCall(address _target, bytes calldata _data)
        public
        override
        onlyAuth
        onlyContract(_target)
    {
        (bool success, bytes memory returndata) = _target.delegatecall(_data);

        if (!success) returndata.revertWithError("OpsProxy: _delegateCallTo: ");

        emit ExecuteDelegateCall(_target, _data, returndata);
    }
}
