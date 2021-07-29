// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

import {Gelatofied} from "./Gelatofied.sol";
import {GelatoBytes} from "./GelatoBytes.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PokeMe2 is ReentrancyGuard, Gelatofied {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using GelatoBytes for bytes;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.AddressSet;

    mapping(bytes32 => address) public calleeOfTask;
    mapping(bytes32 => address) public execAddresses;
    mapping(address => mapping(address => uint256)) public balanceOfCallee;
    mapping(address => EnumerableSet.Bytes32Set) internal _createdTasks;
    mapping(address => EnumerableSet.AddressSet) internal _tokenCredits;

    constructor(address payable _gelato) Gelatofied(_gelato) {}

    event TaskCreated(
        address execAddress,
        bytes4 selector,
        address resolver,
        bytes resolverData
    );
    event TaskCancelled(bytes32 task);
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
    event ExecSuccess(
        uint256 indexed txFee,
        address indexed feeToken,
        address indexed execAddress,
        bytes execData
    );

    function createTask(
        address _execAddress,
        bytes4 _execSelector,
        address _resolver,
        bytes calldata _resolverData
    ) external {
        bytes32 _task = getTaskId(_execAddress, _execSelector);

        require(
            calleeOfTask[_task] == address(0),
            "PokeMe: createTask: Sender already started task"
        );

        _createdTasks[msg.sender].add(_task);
        calleeOfTask[_task] = msg.sender;
        execAddresses[_task] = _execAddress;

        emit TaskCreated(_execAddress, _execSelector, _resolver, _resolverData);
    }

    function cancelTask(bytes32 _task) external {
        require(
            calleeOfTask[_task] != address(0),
            "PokeMe: cancelTask: Sender did not start task yet"
        );

        _createdTasks[msg.sender].remove(_task);
        delete calleeOfTask[_task];
        delete execAddresses[_task];

        emit TaskCancelled(_task);
    }

    function exec(
        uint256 _txFee,
        address _feeToken,
        address _execAddress,
        bytes calldata _execData
    ) external gelatofy(_txFee, _feeToken) {
        bytes32 task = getTaskId(
            _execAddress,
            _execData.calldataSliceSelector()
        );

        address _callee = calleeOfTask[task];
        require(_callee != address(0), "PokeMe: exec: No task found");

        (bool success, ) = _execAddress.call(_execData);
        require(success, "PokeMe: exec: Execution failed");

        uint256 _balanceOfCallee = balanceOfCallee[_callee][_feeToken];

        balanceOfCallee[_callee][_feeToken] = _balanceOfCallee.sub(_txFee);

        emit ExecSuccess(_txFee, _feeToken, _execAddress, _execData);
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

        balanceOfCallee[_receiver][_token] = balanceOfCallee[_receiver][_token]
            .add(depositAmount);

        if (!_tokenCredits[msg.sender].contains(_token))
            _tokenCredits[msg.sender].add(_token);

        emit FundsDeposited(_receiver, _token, depositAmount);
    }

    function withdrawFunds(address _token, uint256 _amount)
        external
        nonReentrant
    {
        uint256 balance = balanceOfCallee[msg.sender][_token];

        uint256 withdrawAmount = Math.min(balance, _amount);

        balanceOfCallee[msg.sender][_token] = balance.sub(withdrawAmount);

        _transfer(payable(msg.sender), _token, withdrawAmount);

        if (withdrawAmount == balance) _tokenCredits[msg.sender].remove(_token);

        emit FundsWithdrawn(msg.sender, _token, withdrawAmount);
    }

    function getTaskId(
        address _execAddress,
        bytes4 _selector
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(_execAddress, _selector));
    }

    /*
    "transfer(address,uint256)"
    0xa9059cbb
    "transferFrom(address,address,uint256)"
    0x23b872dd
    */
    function getSelector(string calldata _func) external pure returns (bytes4) {
        return bytes4(keccak256(bytes(_func)));
    }

    function getTaskIdsByUser(address _callee) external view returns(bytes32[] memory taskIds) {
        for (uint256 i; i < _createdTasks[_callee].length(); i++) {
            taskIds[i] = _createdTasks[_callee].at(i);
        }
    }

    function getCreditTokensByUser(address _callee) external view returns(address[] memory creditTokens) {
        for (uint256 i; i < _createdTasks[_callee].length(); i++) {
            creditTokens[i] = _tokenCredits[_callee].at(i);
        }
    }
}
