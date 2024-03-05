// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.19 <0.9.0;

import {PRBTest} from "prb-test/PRBTest.sol";
import {StdCheats} from "forge-std/StdCheats.sol";
import {StdUtils} from "forge-std/StdUtils.sol";
import {console} from "forge-std/console.sol";

struct Users {
    address payable deployer;
    address payable user;
    address payable gelato;
    address payable dedicatedMsgSender;
}

/// @notice Common contract members needed across test contracts.
abstract contract BaseTest is PRBTest, StdCheats, StdUtils {
    /*//////////////////////////////////////////////////////////////
                               VARIABLES
    //////////////////////////////////////////////////////////////*/

    Users internal _users;

    /*//////////////////////////////////////////////////////////////
                            SET-UP FUNCTION
    //////////////////////////////////////////////////////////////*/

    /// @dev A setup function invoked before each test case.
    function setUp() public virtual {
        // Create users for testing.
        _users = Users({
            deployer: _createUser("Deployer"),
            user: _createUser("User"),
            gelato: _createUser("Gelato"),
            dedicatedMsgSender: _createUser("DedicatedMsgSender")
        });

        // Make the deployer the default caller in all subsequent tests.
        vm.startPrank({msgSender: _users.deployer});
    }

    /*//////////////////////////////////////////////////////////////
                                HELPERS
    //////////////////////////////////////////////////////////////*/

    /// @dev Generates a user, labels its address, and funds it with 100 test ether.
    function _createUser(string memory name)
        internal
        returns (address payable)
    {
        return _createUser(name, 100 ether);
    }

    /// @dev Generates a user, labels its address, and funds it with test balance.
    function _createUser(string memory name, uint256 balance)
        internal
        returns (address payable)
    {
        address payable user = payable(makeAddr(name));
        vm.deal({account: user, newBalance: balance});
        return user;
    }

    function _fork(string memory network, uint256 blockNumber) internal {
        string memory defaultApiKey = string("");
        string memory alchemyApiKey = vm.envOr("ALCHEMY_ID", defaultApiKey);

        assertNotEq(alchemyApiKey, defaultApiKey);

        vm.createSelectFork({urlOrAlias: network, blockNumber: blockNumber});
    }

    /// @dev Helper function that multiplies the `amount` by `10^18` and returns a `uint256.`
    function _toWei(uint256 value) internal pure returns (uint256 result) {
        result = _bn(value, 18);
    }

    /// @dev Helper function that multiplies the `amount` by `10^decimals` and returns a `uint256.`
    function _bn(uint256 amount, uint256 decimals)
        internal
        pure
        returns (uint256 result)
    {
        result = amount * 10**decimals;
    }
}
