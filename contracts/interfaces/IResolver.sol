// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @notice Standard interface that should be used when creating a resolver.
 *
 * NOTE `checker` can be non view as well as it will be
 * called with static call off chain
 */
interface IResolver {
    function checker()
        external
        view
        returns (bool canExec, bytes memory execPayload);
}
