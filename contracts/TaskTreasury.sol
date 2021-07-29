// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {_transfer, ETH} from "./FGelato.sol";

contract TaskTreasury is Ownable, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;

    mapping(address => mapping(address => uint256)) public userTokenBalance;
    mapping(address => EnumerableSet.AddressSet) internal _tokenCredits;
    mapping(address => bool) public whitelistedServices;
    address payable public immutable gelato;

    event FundsDeposited(
        address indexed sender,
        address indexed token,
        uint256 indexed amount
    );
    event FundsWithdrawn(
        address indexed receiver,
        address indexed token,
        uint256 amount
    );

    constructor(address payable _gelato) {
        gelato = _gelato;
    }

    modifier onlyWhitelistedServices() {
        require(
            whitelistedServices[msg.sender],
            "TaskTreasury: onlyWhitelistedServices"
        );
        _;
    }

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

        if (!_tokenCredits[msg.sender].contains(_token))
            _tokenCredits[msg.sender].add(_token);

        emit FundsDeposited(_receiver, _token, depositAmount);
    }

    function withdrawFunds(address _token, uint256 _amount)
        external
        nonReentrant
    {
        uint256 balance = userTokenBalance[msg.sender][_token];

        uint256 withdrawAmount = Math.min(balance, _amount);

        userTokenBalance[msg.sender][_token] = balance - withdrawAmount;

        _transfer(payable(msg.sender), _token, withdrawAmount);

        if (withdrawAmount == balance) _tokenCredits[msg.sender].remove(_token);

        emit FundsWithdrawn(msg.sender, _token, withdrawAmount);
    }

    function useFunds(
        address _token,
        uint256 _amount,
        address _user
    ) external onlyWhitelistedServices {
        uint256 _balanceOfCallee = userTokenBalance[_user][_token];

        userTokenBalance[_user][_token] = _balanceOfCallee - _amount;

        _transfer(gelato, _token, _amount);
    }

    // Governance functions
    function addWhitelistedService(address _service) external onlyOwner {
        require(
            whitelistedServices[_service] == false,
            "TaskTreasury: addWhitelistedService: whitelisted"
        );
        whitelistedServices[_service] = true;
    }

    // Governance functions
    function removeWhitelistedService(address _service) external onlyOwner {
        require(
            whitelistedServices[_service] == true,
            "TaskTreasury: addWhitelistedService: !whitelisted"
        );
        whitelistedServices[_service] = false;
    }

    // View Funcs
    function getCreditTokensByUser(address _callee)
        external
        view
        returns (address[] memory)
    {
        uint256 length = _tokenCredits[_callee].length();
        address[] memory creditTokens = new address[](length);

        for (uint256 i; i < length; i++) {
            creditTokens[i] = _tokenCredits[_callee].at(i);
        }

        return creditTokens;
    }
}
