// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

import {
    Initializable
} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {GelatoBytes} from "../vendor/gelato/GelatoBytes.sol";
import {_call} from "../functions/FExec.sol";
import {IOpsProxy} from "../interfaces/IOpsProxy.sol";

contract OpsProxy is IOpsProxy, Initializable {
    using GelatoBytes for bytes;

    address public immutable override ops;
    address public override owner;

    modifier onlyAuth() {
        require(
            msg.sender == ops || msg.sender == owner,
            "OpsProxy: Not authorised"
        );

        if (msg.sender == ops) {
            address taskCreator = _getTaskCreator();

            require(
                taskCreator == owner,
                "OpsProxy: Only tasks created by owner"
            );
        }
        _;
    }

    // solhint-disable no-empty-blocks
    constructor(address _ops) {
        ops = _ops;
    }

    receive() external payable {}

    function initialize(address _owner) external initializer {
        owner = _owner;
    }

    ///@inheritdoc IOpsProxy
    function batchExecuteCall(
        address[] calldata _targets,
        bytes[] calldata _datas,
        uint256[] calldata _values
    ) external payable override onlyAuth {
        uint256 length = _targets.length;
        require(
            length == _datas.length && length == _values.length,
            "OpsProxy: Length mismatch"
        );

        for (uint256 i; i < length; i++)
            executeCall(_targets[i], _datas[i], _values[i]);
    }

    ///@inheritdoc IOpsProxy
    function executeCall(
        address _target,
        bytes calldata _data,
        uint256 _value
    ) public payable override onlyAuth {
        (, bytes memory returnData) = _call(
            _target,
            _data,
            0,
            true,
            "OpsProxy.executeCall: "
        );

        emit ExecuteCall(_target, _data, _value, returnData);
    }

    function _getTaskCreator() private pure returns (address taskCreator) {
        assembly {
            taskCreator := shr(96, calldataload(sub(calldatasize(), 20)))
        }
    }
}
