// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

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
import {_transfer, ETH} from "../Gelato/FGelato.sol";
import {IOracleAggregator} from "../interfaces/IOracleAggregator.sol";
import {ITaskTreasury} from "../interfaces/ITaskTreasury.sol";

contract TaskTreasuryAccounting is Ownable, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;

    mapping(address => mapping(address => uint256)) public userTokenBalance;
    mapping(address => EnumerableSet.AddressSet) internal _tokenCredits;
    EnumerableSet.AddressSet internal _whitelistedServices;
    address payable public immutable gelato;
    address public immutable oldTreasury;
    address public immutable oracle;

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

    modifier onlyWhitelistedServices() {
        require(
            _whitelistedServices.contains(msg.sender),
            "TaskTreasuryAccounting: onlyWhitelistedServices"
        );
        _;
    }

    constructor(
        address payable _gelato,
        address _oracle,
        address _oldTreasury
    ) {
        gelato = _gelato;
        oracle = _oracle;
        oldTreasury = _oldTreasury;
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

    /// @notice Function called by whitelisted services to handle payments, e.g. PokeMe"
    /// @param _token Token to be used for payment by users
    /// @param _amount Amount to be deducted
    /// @param _user Address of user whose balance will be deducted
    function useFunds(
        address _token,
        uint256 _amount,
        address _user
    ) external onlyWhitelistedServices {
        uint256 balance = userTokenBalance[_user][_token];

        require(
            balance >= _amount,
            "TaskTreasuryAccounting: useFunds: Insufficient Funds"
        );

        userTokenBalance[_user][_token] = balance - _amount;

        address owner = owner();
        userTokenBalance[owner][_token] =
            userTokenBalance[owner][_token] +
            _amount;

        if (userTokenBalance[_user][_token] == 0)
            _tokenCredits[_user].remove(_token);

        emit LogDeductFees(_user, tx.origin, _token, _amount, msg.sender);
    }

    // Governance functions

    /// @notice Add new service that can call useFunds. Gelato Governance
    /// @param _service New service to add
    function addWhitelistedService(address _service) external onlyOwner {
        require(
            !_whitelistedServices.contains(_service),
            "TaskTreasuryAccounting: addWhitelistedService: whitelisted"
        );
        _whitelistedServices.add(_service);
    }

    /// @notice Remove old service that can call useFunds. Gelato Governance
    /// @param _service Old service to remove
    function removeWhitelistedService(address _service) external onlyOwner {
        require(
            _whitelistedServices.contains(_service),
            "TaskTreasuryAccounting: addWhitelistedService: !whitelisted"
        );
        _whitelistedServices.remove(_service);
    }

    // View Funcs

    function getWhitelistedServices() external view returns (address[] memory) {
        uint256 length = _whitelistedServices.length();
        address[] memory whitelistedServices = new address[](length);

        for (uint256 i; i < length; i++) {
            whitelistedServices[i] = _whitelistedServices.at(i);
        }
        return whitelistedServices;
    }

    /// @notice Chooses token with highest balance to be used for payment
    /// @notice Only to be called off-chain
    /// @param _user User to get top credit token from
    function getTopCreditToken(address _user)
        external
        view
        returns (
            uint256 topCreditInNativeToken,
            address topCreditToken,
            address treasuryAddress
        )
    {
        address[] memory creditTokensOld = ITaskTreasury(oldTreasury)
            .getCreditTokensByUser(_user);
        address[] memory creditTokensNew = getCreditTokensByUser(_user);
        uint256 creditTokensLength = creditTokensOld.length +
            creditTokensNew.length;
        address[] memory creditTokensToCheck = creditTokensOld;
        address treasuryToCheck = oldTreasury;
        uint256 ptr;

        for (uint256 x; x < creditTokensLength; x++) {
            if (treasuryToCheck == oldTreasury && x >= creditTokensOld.length) {
                // start checking credits in new treasury
                treasuryToCheck = address(this);
                creditTokensToCheck = creditTokensNew;
                ptr = 0;
            }

            uint256 credit = ITaskTreasury(treasuryToCheck).userTokenBalance(
                _user,
                creditTokensToCheck[ptr]
            );

            (uint256 creditInNativeToken, ) = IOracleAggregator(oracle)
                .getExpectedReturnAmount(credit, creditTokensToCheck[ptr], ETH);

            if (creditInNativeToken > topCreditInNativeToken) {
                topCreditInNativeToken = creditInNativeToken;
                topCreditToken = creditTokensToCheck[ptr];
                treasuryAddress = treasuryToCheck;
            }
            ptr++;
        }
    }

    /// @notice Helper func to get all deposited tokens by a user
    /// @param _user User to get the balances from
    function getCreditTokensByUser(address _user)
        public
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
}
