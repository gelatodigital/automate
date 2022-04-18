// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {OpsReady} from "../../vendor/gelato/OpsReady.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IOps} from "../../interfaces/IOps.sol";

contract CounterWithoutTreasury is OpsReady, Ownable {
    uint256 public count;
    uint256 public lastExecuted;
    mapping(address => bool) public whitelisted;

    modifier onlyWhitelisted() {
        require(
            whitelisted[msg.sender] ||
                msg.sender == ops ||
                msg.sender == owner(),
            "Counter: Not whitelisted"
        );
        _;
    }

    // solhint-disable no-empty-blocks
    constructor(address _ops) OpsReady(_ops) {}

    receive() external payable {}

    // solhint-disable not-rely-on-time
    function increaseCount(uint256 amount) external onlyWhitelisted {
        require(
            ((block.timestamp - lastExecuted) > 180),
            "Counter: increaseCount: Time not elapsed"
        );

        count += amount;
        lastExecuted = block.timestamp;

        uint256 fee;
        address feeToken;

        (fee, feeToken) = IOps(ops).getFeeDetails();

        _transfer(fee, feeToken);
    }

    function setWhitelist(address _account, bool _whitelist)
        external
        onlyOwner
    {
        whitelisted[_account] = _whitelist;
    }
}
