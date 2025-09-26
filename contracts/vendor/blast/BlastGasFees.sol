// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.14;

import {Proxied} from "../proxy/EIP173/Proxied.sol";
import {IBlast} from "./interfaces/IBlast.sol";

contract BlastGasFees is Proxied {
    IBlast public constant BLAST =
        IBlast(0x4300000000000000000000000000000000000002);

    function configureClaimableGas() external onlyProxyAdmin {
        BLAST.configureClaimableGas();
    }

    function claimAllGas(address _recipient) external onlyProxyAdmin {
        BLAST.claimAllGas(address(this), _recipient);
    }

    function claimMaxGas(address _recipient) external onlyProxyAdmin {
        BLAST.claimMaxGas(address(this), _recipient);
    }
}
