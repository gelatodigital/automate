// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {TaskModuleBase} from "./TaskModuleBase.sol";
import {IOpsProxy} from "../interfaces/IOpsProxy.sol";
import {IOpsProxyFactory} from "../interfaces/IOpsProxyFactory.sol";

contract ProxyModule is TaskModuleBase {
    IOpsProxyFactory public immutable opsProxyFactory;

    constructor(IOpsProxyFactory _opsProxyFactory) {
        opsProxyFactory = _opsProxyFactory;
    }

    /**
     * @inheritdoc TaskModuleBase
     */
    function onCreateTask(
        bytes32,
        address _taskCreator,
        address,
        bytes calldata,
        bytes calldata
    ) external override {
        _deployIfNoProxy(_taskCreator);
    }

    /**
     * @inheritdoc TaskModuleBase
     * @dev _taskCreator cannot create task to other user's proxy
     */
    function preCreateTask(address _taskCreator, address _execAddress)
        external
        view
        override
        returns (address, address)
    {
        address ownerOfExecAddress = opsProxyFactory.ownerOf(_execAddress);

        if (ownerOfExecAddress != address(0)) {
            // creating task to proxy
            require(
                _taskCreator == ownerOfExecAddress ||
                    _taskCreator == _execAddress,
                "ProxyModule: Only owner of proxy"
            );

            return (ownerOfExecAddress, _execAddress);
        } else {
            address ownerOfTaskCreator = opsProxyFactory.ownerOf(_taskCreator);

            if (ownerOfTaskCreator != address(0)) {
                // creating task to non proxy, with proxy
                // give task ownership to proxy owner
                return (ownerOfTaskCreator, _execAddress);
            }

            // creating task to non proxy, without proxy
            return (_taskCreator, _execAddress);
        }
    }

    function preCancelTask(bytes32, address _taskCreator)
        external
        view
        override
        returns (address)
    {
        address ownerOfTaskCreator = opsProxyFactory.ownerOf(_taskCreator);

        if (ownerOfTaskCreator != address(0)) {
            return ownerOfTaskCreator;
        }

        return _taskCreator;
    }

    /**
     * @inheritdoc TaskModuleBase
     * @dev _execData is encoded with proxy's `executeCall` function
     * unless _execAddress is OpsProxy which assumes that _execData is encoded
     * with `executeCall` or `batchExecuteCall`.
     */
    function preExecCall(
        bytes32,
        address _taskCreator,
        address _execAddress,
        bytes calldata _execData
    ) external view override returns (address, bytes memory execData) {
        (address proxy, ) = opsProxyFactory.getProxyOf(_taskCreator);

        execData = _execAddress == proxy
            ? _execData
            : _encodeWithOpsProxy(_execAddress, _execData);

        _execAddress = proxy;

        return (_execAddress, execData);
    }

    function _deployIfNoProxy(address _taskCreator) private {
        bool isTaskCreatorProxy = opsProxyFactory.ownerOf(_taskCreator) !=
            address(0);

        if (!isTaskCreatorProxy) {
            (, bool deployed) = opsProxyFactory.getProxyOf(_taskCreator);
            if (!deployed) opsProxyFactory.deployFor(_taskCreator);
        }
    }

    function _encodeWithOpsProxy(address _execAddress, bytes calldata _execData)
        private
        pure
        returns (bytes memory)
    {
        return
            abi.encodeWithSelector(
                IOpsProxy.executeCall.selector,
                _execAddress,
                _execData,
                0
            );
    }
}
