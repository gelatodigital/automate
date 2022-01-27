// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.11;

import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {
    SafeERC20,
    IERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {
    OwnableUpgradeable
} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {
    ReentrancyGuardUpgradeable
} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {
    Initializable
} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {_transfer, ETH} from "../vendor/gelato/FGelato.sol";
import {ITaskTreasury} from "../interfaces/ITaskTreasury.sol";

contract TaskTreasuryUpgradable is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;

    address payable public immutable gelato;
    ITaskTreasury public immutable oldTreasury;

    mapping(address => mapping(address => uint256)) public userTokenBalance;
    mapping(address => EnumerableSet.AddressSet) internal _tokenCredits;
    EnumerableSet.AddressSet internal _whitelistedServices;

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

    constructor(address payable _gelato, address _oldTreasury) {
        gelato = _gelato;
        oldTreasury = ITaskTreasury(_oldTreasury);
    }

    receive() external payable {
        depositFunds(msg.sender, ETH, msg.value);
    }

    function initialize() external initializer {
        __Ownable_init();
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
        migrateFunds(_user);

        _chargeUser(_user, _token, _amount);

        _creditUser(owner(), _token, _amount);

        emit LogDeductFees(_user, tx.origin, _token, _amount, msg.sender);
    }

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

    function getWhitelistedServices() external view returns (address[] memory) {
        uint256 length = _whitelistedServices.length();
        address[] memory whitelistedServices = new address[](length);

        for (uint256 i; i < length; i++) {
            whitelistedServices[i] = _whitelistedServices.at(i);
        }
        return whitelistedServices;
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
    ) public payable {
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

        _creditUser(_receiver, _token, depositAmount);

        migrateFunds(_receiver);

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
    ) public nonReentrant {
        uint256 balance = userTokenBalance[msg.sender][_token];

        uint256 withdrawAmount = Math.min(balance, _amount);

        _chargeUser(msg.sender, _token, withdrawAmount);

        _transfer(_receiver, _token, withdrawAmount);

        emit FundsWithdrawn(_receiver, msg.sender, _token, withdrawAmount);
    }

    function migrateFunds(address _user) public {
        address[] memory creditTokens = oldTreasury.getCreditTokensByUser(
            _user
        );

        for (uint256 i; i < creditTokens.length; i++) {
            address token = creditTokens[i];
            uint256 amount = oldTreasury.userTokenBalance(_user, token);

            oldTreasury.useFunds(token, amount, _user);
            _creditUser(_user, token, amount);
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

    function _creditUser(
        address _user,
        address _token,
        uint256 _amount
    ) internal {
        uint256 balance = userTokenBalance[_user][_token];

        userTokenBalance[_user][_token] = balance + _amount;

        if (!_tokenCredits[_user].contains(_token))
            _tokenCredits[_user].add(_token);
    }

    function _chargeUser(
        address _user,
        address _token,
        uint256 _amount
    ) internal {
        uint256 balance = userTokenBalance[_user][_token];

        userTokenBalance[_user][_token] = balance - _amount;

        if (_amount == balance) _tokenCredits[_user].remove(_token);
    }
}
