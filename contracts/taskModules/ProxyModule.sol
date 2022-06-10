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
     * @dev _taskCreator cannot create task to other user's proxy
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
     * @dev _execData is encoded with proxy's `executeCall` function.
     */
    function preExecTask(
        bytes32,
        address _taskCreator,
        address _execAddress,
        bytes calldata _execData
    ) external override returns (address, bytes memory execData) {
        address proxy = _deployIfNoProxy(_taskCreator);

        execData = _execAddress == proxy
            ? _execData
            : _encodeWithOpsProxy(_execAddress, _execData);

        _execAddress = proxy;

        return (_execAddress, execData);
    }

    function _deployIfNoProxy(address _taskCreator)
        private
        returns (address proxy)
    {
        bool deployed;
        (proxy, deployed) = opsProxyFactory.getProxyOf(_taskCreator);

        if (!deployed) opsProxyFactory.deployFor(_taskCreator);
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
