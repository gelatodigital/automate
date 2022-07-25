// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "./EIP173NonTransferable.sol";

///@notice Proxy implementing EIP173 for ownership management that accept ETH via receive
contract EIP173NonTransferableWithCustomReceive is EIP173NonTransferable {
    constructor(
        address implementationAddress,
        address ownerAddress,
        bytes memory data
    )
        payable
        EIP173NonTransferable(implementationAddress, ownerAddress, data)
    {}

    receive() external payable override {
        _fallback();
    }
}
