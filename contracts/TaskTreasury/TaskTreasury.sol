// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {
    SafeERC20,
    IERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {_transfer, ETH} from "../functions/FUtils.sol";

contract TaskTreasury is Ownable, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;

    mapping(address => mapping(address => uint256)) public userTokenBalance;
    mapping(address => EnumerableSet.AddressSet) internal _tokenCredits;
    EnumerableSet.AddressSet internal _whitelistedServices;
    address payable public immutable gelato;

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

    modifier onlyWhitelistedServices() {
        require(
            _whitelistedServices.contains(msg.sender),
            "TaskTreasury: onlyWhitelistedServices"
        );
        _;
    }

    constructor(address payable _gelato) {
        gelato = _gelato;
    }

    // solhint-disable max-line-length
    /// @notice Function to deposit Funds which will be used to execute transactions on various services
    /// @param _receiver Address receiving the credits
    /// @param _token Token to be credited, use "0xeeee...." for ETH
    /// @param _amount Amount to be credited
    function depositFunds(
        address _receiver,
        address _token,
        uint256 _amount
    ) external payable {
        uint256 depositAmount;
        if (_token == ETH) {
            depositAmount = msg.value;
        } else {
            IERC20 token = IERC20(_token);
            uint256 preBalance = token.balanceOf(address(this));
            token.safeTransferFrom(msg.sender, address(this), _amount);
            uint256 postBalance = token.balanceOf(address(this));
            depositAmount = postBalance - preBalance;
        }

        userTokenBalance[_receiver][_token] =
            userTokenBalance[_receiver][_token] +
            depositAmount;

        if (!_tokenCredits[_receiver].contains(_token))
            _tokenCredits[_receiver].add(_token);

        emit FundsDeposited(_receiver, _token, depositAmount);
    }

    /// @notice Function to withdraw Funds back to the _receiver
    /// @param _receiver Address receiving the credits
    /// @param _token Token to be credited, use "0xeeee...." for ETH
    /// @param _amount Amount to be credited
    function withdrawFunds(
        address payable _receiver,
        address _token,
        uint256 _amount
    ) external nonReentrant {
        uint256 balance = userTokenBalance[msg.sender][_token];

        uint256 withdrawAmount = Math.min(balance, _amount);

        userTokenBalance[msg.sender][_token] = balance - withdrawAmount;

        _transfer(_receiver, _token, withdrawAmount);

        if (withdrawAmount == balance) _tokenCredits[msg.sender].remove(_token);

        emit FundsWithdrawn(_receiver, msg.sender, _token, withdrawAmount);
    }

    /// @notice Function called by whitelisted services to handle payments, e.g. Ops"
    /// @param _token Token to be used for payment by users
    /// @param _amount Amount to be deducted
    /// @param _user Address of user whose balance will be deducted
    function useFunds(
        address _token,
        uint256 _amount,
        address _user
    ) external onlyWhitelistedServices {
        userTokenBalance[_user][_token] =
            userTokenBalance[_user][_token] -
            _amount;

        if (userTokenBalance[_user][_token] == 0)
            _tokenCredits[_user].remove(_token);

        _transfer(gelato, _token, _amount);
    }

    // Governance functions

    /// @notice Add new service that can call useFunds. Gelato Governance
    /// @param _service New service to add
    function addWhitelistedService(address _service) external onlyOwner {
        require(
            !_whitelistedServices.contains(_service),
            "TaskTreasury: addWhitelistedService: whitelisted"
        );
        _whitelistedServices.add(_service);
    }

    /// @notice Remove old service that can call useFunds. Gelato Governance
    /// @param _service Old service to remove
    function removeWhitelistedService(address _service) external onlyOwner {
        require(
            _whitelistedServices.contains(_service),
            "TaskTreasury: addWhitelistedService: !whitelisted"
        );
        _whitelistedServices.remove(_service);
    }

    // View Funcs

    /// @notice Helper func to get all deposited tokens by a user
    /// @param _user User to get the balances from
    function getCreditTokensByUser(address _user)
        external
        view
        returns (address[] memory)
    {
        uint256 length = _tokenCredits[_user].length();
        address[] memory creditTokens = new address[](length);

        for (uint256 i; i < length; i++) {
            creditTokens[i] = _tokenCredits[_user].at(i);
        }
        return creditTokens;
    }

    function getWhitelistedServices() external view returns (address[] memory) {
        uint256 length = _whitelistedServices.length();
        address[] memory whitelistedServices = new address[](length);

        for (uint256 i; i < length; i++) {
            whitelistedServices[i] = _whitelistedServices.at(i);
        }
        return whitelistedServices;
    }
}
