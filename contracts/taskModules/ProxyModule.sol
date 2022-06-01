// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.12;

import {GelatoBytes} from "../vendor/gelato/GelatoBytes.sol";
import {TaskModuleBase} from "./TaskModuleBase.sol";
import {LibDataTypes} from "../libraries/LibDataTypes.sol";
import {IOpsUserProxy} from "../interfaces/IOpsUserProxy.sol";
import {IOpsUserProxyFactory} from "../interfaces/IOpsUserProxyFactory.sol";

contract ProxyModule is TaskModuleBase {
    using GelatoBytes for bytes;

    IOpsUserProxyFactory public immutable opsUserProxyFactory;

    constructor(IOpsUserProxyFactory _opsUserProxyFactory) {
        opsUserProxyFactory = _opsUserProxyFactory;
    }

    /**
     * @dev _taskCreator cannot create task to other user's proxy
     */
    function onCreateTask(
        bytes32,
        address _taskCreator,
        address _execAddress,
        bytes calldata,
        bytes calldata
    ) external override {
        address proxy = _deployIfNoProxy(_taskCreator);

        bool execToProxy = opsUserProxyFactory.isProxy(_execAddress);

        if (execToProxy)
            require(_execAddress == proxy, "ProxyModule: Only proxy owner");
    }

    /**
     * @dev _execData is encoded with proxy's `executeCall` function if
     * _execAddress is not a proxy. If _execAddress is proxy, _execData
     * should have function signatures of `executeCall` or `batchExecuteCall`
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
            : _encodeWithOpsUserProxy(_execAddress, _execData);

        _execAddress = proxy;

        return (_execAddress, execData);
    }

    function _deployIfNoProxy(address _taskCreator)
        private
        returns (address proxy)
    {
        bool deployed;
        (proxy, deployed) = opsUserProxyFactory.getProxyOf(_taskCreator);

        if (!deployed) opsUserProxyFactory.deployFor(_taskCreator);
    }

    function _encodeWithOpsUserProxy(
        address _execAddress,
        bytes calldata _execData
    ) private pure returns (bytes memory) {
        return
            abi.encodeWithSelector(
                IOpsUserProxy.executeCall.selector,
                _execAddress,
                _execData,
                0
            );
    }
}
