// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// solhint-disable not-rely-on-time
contract CounterWL is Ownable {
    uint256 public count;
    uint256 public lastExecuted;
    mapping(address => bool) public whitelisted;

    modifier onlyWhitelisted() {
        require(
            whitelisted[msg.sender] || msg.sender == owner(),
            "Counter: Not whitelisted"
        );
        _;
    }

    function increaseCount(uint256 amount) external onlyWhitelisted {
        require(
            ((block.timestamp - lastExecuted) > 180),
            "Counter: increaseCount: Time not elapsed"
        );

        count += amount;
        lastExecuted = block.timestamp;
    }

    function setWhitelist(address _account, bool _whitelist)
        external
        onlyOwner
    {
        whitelisted[_account] = _whitelist;
    }
}
