// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

interface ITaskTreasury {
    function getCreditTokensByUser(address _user)
        external
        view
        returns (address[] memory);

    function userTokenBalance(address _user, address _token)
        external
        view
        returns (uint256 _balance);
}
