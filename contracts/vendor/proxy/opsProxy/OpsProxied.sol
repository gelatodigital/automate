// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {IOpsProxyFactory} from "./interfaces/IOpsProxyFactory.sol";

abstract contract OpsProxied {
    function _checkForOpsProxyAndGetTaskCreator(
        IOpsProxyFactory _opsProxyFactory,
        address _execAddress,
        address _taskCreator
    ) internal returns (address) {
        bool taskCreatorIsProxy = _opsProxyFactory.isProxy(_taskCreator);

        // user creating task
        if (!taskCreatorIsProxy) {
            (address opsProxyAddress, bool deployed) = _opsProxyFactory
                .getProxyOf(_taskCreator);

            bool execAddressIsProxy = _opsProxyFactory.isProxy(_execAddress);
            bool execAddressIsProxyOfCreator = _execAddress == opsProxyAddress;

            if (!deployed && execAddressIsProxyOfCreator)
                _opsProxyFactory.deployFor(_taskCreator);

            // user creating task for proxy
            if (execAddressIsProxy)
                _onlyOwnerOrProxy(_opsProxyFactory, _execAddress, _taskCreator);

            return _taskCreator;
        } else {
            // proxy creating task
            address opsProxyOwner = _onlyOwnerOrProxy(
                _opsProxyFactory,
                _taskCreator,
                _taskCreator
            );

            return opsProxyOwner;
        }
    }

    function _onlyOwnerOrProxy(
        IOpsProxyFactory _opsProxyFactory,
        address _opsProxyAddress,
        address _taskCreator
    ) internal view returns (address opsProxyOwner) {
        opsProxyOwner = _opsProxyFactory.getOwnerOf(_opsProxyAddress);

        require(
            _taskCreator == _opsProxyAddress || _taskCreator == opsProxyOwner,
            "Ops: _onlyOwnerOrProxy"
        );
    }
}
