// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {
    IERC20,
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {
    ReentrancyGuardUpgradeable
} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {
    Initializable
} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {_transfer, ETH} from "../functions/FUtils.sol";
import {Proxied} from "../vendor/proxy/EIP173/Proxied.sol";
import {ITaskTreasury} from "../interfaces/ITaskTreasury.sol";
import {
    ITaskTreasuryUpgradable
} from "../interfaces/ITaskTreasuryUpgradable.sol";
import {LibShares} from "../libraries/LibShares.sol";

contract TaskTreasuryUpgradable is
    ITaskTreasuryUpgradable,
    Proxied,
    Initializable,
    ReentrancyGuardUpgradeable
{
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;

    ITaskTreasury public immutable oldTreasury;
    uint256 public constant MIN_SHARES_IN_TREASURY = 1e12;
    uint256 public maxFee;

    ///@dev tracks token shares of users
    mapping(address => mapping(address => uint256)) public shares;

    ///@dev tracks total shares of tokens
    mapping(address => uint256) public totalShares;

    ///@dev tracks the tokens deposited by users
    mapping(address => EnumerableSet.AddressSet) internal _tokens;

    EnumerableSet.AddressSet internal _whitelistedServices;

    modifier onlyWhitelistedServices() {
        require(
            _whitelistedServices.contains(msg.sender),
            "TaskTreasury: onlyWhitelistedServices"
        );
        _;
    }

    constructor(ITaskTreasury _oldTreasury) {
        oldTreasury = _oldTreasury;
    }

    receive() external payable {
        depositFunds(msg.sender, ETH, msg.value);
    }

    function initialize(uint256 _maxFee) external initializer {
        maxFee = _maxFee;
        __ReentrancyGuard_init();
    }

    /// @notice Function called by whitelisted services to handle payments, e.g. Gelato Ops
    /// @param _user Address of user whose balance will be deducted
    /// @param _token Token to be used for payment by users
    /// @param _amount Amount to be deducted
    function useFunds(
        address _user,
        address _token,
        uint256 _amount
    ) external override onlyWhitelistedServices {
        if (maxFee != 0)
            require(maxFee >= _amount, "TaskTreasury: Overcharged");

        uint256 balanceInOld = oldTreasury.userTokenBalance(_user, _token);

        if (_amount <= balanceInOld) {
            oldTreasury.useFunds(_token, _amount, _user);
        } else {
            if (balanceInOld > 0)
                oldTreasury.useFunds(_token, balanceInOld, _user);

            _pay(_user, _token, _amount - balanceInOld);
        }

        emit LogDeductFees(_user, tx.origin, _token, _amount, msg.sender);
    }

    /// @notice Change maxFee charged by Gelato (only relevant on Layer2s)
    /// @param _newMaxFee New Max Fee to charge
    function updateMaxFee(uint256 _newMaxFee) external override onlyProxyAdmin {
        maxFee = _newMaxFee;

        emit UpdatedMaxFee(_newMaxFee);
    }

    /// @notice Add or remove service that can call useFunds. Gelato Governance
    /// @param _service Service to add or remove from whitelist
    /// @param _add Add to whitelist if true, else remove from whitelist
    function updateWhitelistedService(address _service, bool _add)
        external
        override
        onlyProxyAdmin
    {
        if (_add) {
            _whitelistedServices.add(_service);
        } else {
            _whitelistedServices.remove(_service);
        }

        emit UpdatedService(_service, _add);
    }

    /// @notice Get list of services that can call useFunds.
    function getWhitelistedServices()
        external
        view
        override
        returns (address[] memory)
    {
        return _whitelistedServices.values();
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
    ) public payable override nonReentrant {
        uint256 depositAmount;
        uint256 totalBalance;
        if (_token == ETH) {
            depositAmount = msg.value;
        } else {
            require(msg.value == 0, "TaskTreasury: No ETH");
            IERC20 token = IERC20(_token);

            uint256 preBalance = token.balanceOf(address(this));
            token.safeTransferFrom(msg.sender, address(this), _amount);
            uint256 postBalance = token.balanceOf(address(this));

            depositAmount = postBalance - preBalance;
        }

        totalBalance = LibShares.contractBalance(_token) - depositAmount;

        _creditUser(_receiver, _token, depositAmount, totalBalance);

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
    ) public override nonReentrant {
        _deductUser(msg.sender, _token, _amount);

        _transfer(_receiver, _token, _amount);

        emit FundsWithdrawn(_receiver, msg.sender, _token, _amount);
    }

    /// @notice Helper func to get all deposited tokens by a user.
    /// @param _user User to get the balances from
    function getCreditTokensByUser(address _user)
        public
        view
        override
        returns (address[] memory)
    {
        return _tokens[_user].values();
    }

    /// @notice Helper func to get all deposited tokens by a user across treasuries.
    /// @param _user User to get the balances from
    function getTotalCreditTokensByUser(address _user)
        public
        view
        override
        returns (address[] memory)
    {
        address[] memory tokensInNew = _tokens[_user].values();
        address[] memory tokensInOld = oldTreasury.getCreditTokensByUser(_user);

        uint256 tokensInOldOnlyLength;
        for (uint256 i; i < tokensInOld.length; i++) {
            if (!_tokens[_user].contains(tokensInOld[i])) {
                tokensInOld[tokensInOldOnlyLength] = tokensInOld[i];
                tokensInOldOnlyLength++;
            }
        }

        uint256 uniqTokensLength = tokensInNew.length + tokensInOldOnlyLength;
        address[] memory tokens = new address[](uniqTokensLength);

        for (uint256 i; i < uniqTokensLength; i++) {
            if (i < tokensInNew.length) {
                tokens[i] = tokensInNew[i];
            } else {
                uint256 j = i - tokensInNew.length;
                tokens[i] = tokensInOld[j];
            }
        }

        return tokens;
    }

    /// @notice Get balance of a token owned by user
    /// @param _user User to get balance from
    /// @param _token Token to check balance of
    function userTokenBalance(address _user, address _token)
        public
        view
        override
        returns (uint256)
    {
        uint256 totalBalance = LibShares.contractBalance(_token);
        return
            LibShares.sharesToToken(
                shares[_user][_token],
                totalShares[_token],
                totalBalance
            );
    }

    /// @notice Get balance of a token owned by user across treasuries
    /// @param _user User to get balance from
    /// @param _token Token to check balance of
    function totalUserTokenBalance(address _user, address _token)
        public
        view
        override
        returns (uint256)
    {
        uint256 balanceInNew = userTokenBalance(_user, _token);
        uint256 balanceInOld = oldTreasury.userTokenBalance(_user, _token);

        uint256 balance = balanceInNew + balanceInOld;

        return balance;
    }

    function _creditUser(
        address _user,
        address _token,
        uint256 _amount,
        uint256 _totalBalance
    ) internal {
        uint256 sharesTotal = totalShares[_token];
        uint256 sharesToCredit = LibShares.tokenToShares(
            _token,
            _amount,
            sharesTotal,
            _totalBalance
        );

        if (sharesTotal == 0)
            require(
                sharesToCredit >= MIN_SHARES_IN_TREASURY,
                "TaskTreasury: Require MIN_SHARES_IN_TREASURY"
            );

        require(sharesToCredit > 0, "TaskTreasury: Zero shares to credit");

        shares[_user][_token] += sharesToCredit;
        totalShares[_token] = sharesTotal + sharesToCredit;

        _tokens[_user].add(_token);
    }

    function _deductUser(
        address _user,
        address _token,
        uint256 _amount
    ) internal {
        uint256 totalBalance = LibShares.contractBalance(_token);
        uint256 sharesTotal = totalShares[_token];
        uint256 sharesToCharge = LibShares.tokenToShares(
            _token,
            _amount,
            sharesTotal,
            totalBalance
        );

        require(
            sharesTotal - sharesToCharge >= MIN_SHARES_IN_TREASURY,
            "TaskTreasury: Below MIN_SHARES_IN_TREASURY"
        );

        uint256 sharesOfUser = shares[_user][_token];

        shares[_user][_token] = sharesOfUser - sharesToCharge;
        totalShares[_token] = sharesTotal - sharesToCharge;

        if (sharesOfUser == sharesToCharge) _tokens[_user].remove(_token);
    }

    function _pay(
        address _user,
        address _token,
        uint256 _amount
    ) internal {
        address admin = _proxyAdmin();
        require(_user != admin, "TaskTreasury: No proxy admin");

        uint256 totalBalance = LibShares.contractBalance(_token);
        uint256 sharesToPay = LibShares.tokenToShares(
            _token,
            _amount,
            totalShares[_token],
            totalBalance
        );

        require(
            shares[_user][_token] >= sharesToPay,
            "TaskTreasury: Not enough funds"
        );
        shares[_user][_token] -= sharesToPay;
        shares[admin][_token] += sharesToPay;
    }
}
