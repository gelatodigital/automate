// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.11;

interface ITaskTreasury {
    function useFunds(
        address _token,
        uint256 _amount,
        address _user
    ) external;

    function getCreditTokensByUser(address _user)
        external
        view
        returns (address[] memory);

    function userTokenBalance(address _user, address _token)
        external
        view
        returns (uint256);
}
