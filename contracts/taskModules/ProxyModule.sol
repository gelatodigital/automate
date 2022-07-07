// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.12;

import {GelatoBytes} from "../vendor/gelato/GelatoBytes.sol";
import {TaskModuleBase} from "./TaskModuleBase.sol";
import {LibDataTypes} from "../libraries/LibDataTypes.sol";
import {IOpsProxy} from "../interfaces/IOpsProxy.sol";
import {IOpsProxyFactory} from "../interfaces/IOpsProxyFactory.sol";

contract ProxyModule is TaskModuleBase {
    using GelatoBytes for bytes;

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
        bool isExecAddressProxy = opsProxyFactory.isProxy(_execAddress);

        if (isExecAddressProxy) {
            address ownerOfExecAddress = opsProxyFactory.getOwnerOf(
                _execAddress
            );
            require(
                _taskCreator == ownerOfExecAddress,
                "ProxyModule: Only owner of proxy"
            );

            return (ownerOfExecAddress, _execAddress);
        } else {
            bool isTaskCreatorProxy = opsProxyFactory.isProxy(_taskCreator);

            if (isTaskCreatorProxy) {
                address ownerOfTaskCreator = opsProxyFactory.getOwnerOf(
                    _taskCreator
                );

                return (ownerOfTaskCreator, _execAddress);
            }

            return (_taskCreator, _execAddress);
        }
    }

    function preCancelTask(bytes32, address _taskCreator)
        external
        view
        override
        returns (address)
    {
        bool isTaskCreatorProxy = opsProxyFactory.isProxy(_taskCreator);

        if (isTaskCreatorProxy) {
            address ownerOfTaskCreator = opsProxyFactory.getOwnerOf(
                _taskCreator
            );

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
        bool isTaskCreatorProxy = opsProxyFactory.isProxy(_taskCreator);

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
