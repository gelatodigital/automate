// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

interface IExecFacet {
    function exec(
        address _service,
        bytes calldata _data,
        address _creditToken
    ) external;

    function addExecutors(address[] calldata _executors) external;
}
