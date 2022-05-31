// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITaskTreasuryUpgradable {
    /// @notice Events ///

    event FundsDeposited(
        address indexed sender,
        address indexed token,
        uint256 indexed amount
    );

    event FundsWithdrawn(
        address indexed receiver,
        address indexed initiator,
        address indexed token,
        uint256 amount
    );

    event LogDeductFees(
        address indexed user,
        address indexed executor,
        address indexed token,
        uint256 fees,
        address service
    );

    event UpdatedService(address indexed service, bool add);

    event UpdatedMaxFee(uint256 indexed maxFee);

    /// @notice External functions ///

    function depositFunds(
        address receiver,
        address token,
        uint256 amount
    ) external payable;

    function withdrawFunds(
        address payable receiver,
        address token,
        uint256 amount
    ) external;

    function useFunds(
        address user,
        address token,
        uint256 amount
    ) external;

    function updateMaxFee(uint256 _newMaxFee) external;

    function updateWhitelistedService(address service, bool isWhitelist)
        external;

    /// @notice External view functions ///

    function getCreditTokensByUser(address user)
        external
        view
        returns (address[] memory);

    function getTotalCreditTokensByUser(address user)
        external
        view
        returns (address[] memory);

    function getWhitelistedServices() external view returns (address[] memory);

    function totalUserTokenBalance(address user, address token)
        external
        view
        returns (uint256);

    function userTokenBalance(address user, address token)
        external
        view
        returns (uint256);
}
