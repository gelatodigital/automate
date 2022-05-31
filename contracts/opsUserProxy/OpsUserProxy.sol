// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

import {
    Initializable
} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {GelatoBytes} from "../vendor/gelato/GelatoBytes.sol";
import {_call} from "../functions/FExec.sol";
import {IOpsUserProxy} from "../interfaces/IOpsUserProxy.sol";

contract OpsUserProxy is IOpsUserProxy, Initializable {
    using GelatoBytes for bytes;

    address public override ops;
    address public override owner;

    modifier onlyAuth() {
        require(
            msg.sender == ops ||
                msg.sender == owner ||
                msg.sender == address(this),
            "OpsProxy: Not authorised"
        );
        _;
    }

    // solhint-disable no-empty-blocks
    receive() external payable {}

    function initialize(address _ops, address _owner) external initializer {
        ops = _ops;
        owner = _owner;
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
    ) public payable override onlyAuth {
        (, bytes memory returnData) = _call(
            _target,
            _data,
            true,
            "OpsUserProxy.executeCall: "
        );

        emit ExecuteCall(_target, _data, _value, returnData);
    }
}
