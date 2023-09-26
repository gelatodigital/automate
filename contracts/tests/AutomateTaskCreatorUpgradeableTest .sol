// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../integrations/AutomateTaskCreatorUpgradeable.sol";

//solhint-disable no-empty-blocks
contract AutomateTaskCreatorUpgradeableTest is AutomateTaskCreatorUpgradeable {
    constructor(address _automate) AutomateTaskCreatorUpgradeable(_automate) {}

    function initialize() external initializer {
        __AutomateTaskCreator_init();
    }

    function getFeeCollector() external view returns (address) {
        return feeCollector;
    }
}
