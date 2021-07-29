// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

import {Gelatofied} from "./Gelatofied.sol";
import {GelatoBytes} from "./GelatoBytes.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {_transfer, ETH} from "./FGelato.sol";
import {TaskTreasury} from "./TaskTreasury.sol";

contract PokeMe2 is Gelatofied {
    using SafeERC20 for IERC20;
    using GelatoBytes for bytes;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    string constant public version = "2";
    mapping(bytes32 => address) public calleeOfTask;
    mapping(bytes32 => address) public execAddresses;
    mapping(address => mapping(address => uint256)) public balanceOfCallee;
    mapping(address => EnumerableSet.Bytes32Set) internal _createdTasks;
    address public immutable taskTreasury;

    constructor(address payable _gelato, address _taskTreasury) Gelatofied(_gelato) {
        taskTreasury = _taskTreasury;
    }

    event TaskCreated(
        address callee,
        address execAddress,
        bytes4 selector,
        address resolverAddress,
        bytes32 taskId,
        bytes resolverData
    );
    event TaskCancelled(bytes32 taskId);
    event ExecSuccess(
        uint256 indexed txFee,
        address indexed feeToken,
        address indexed execAddress,
        bytes execData
    );

    function createTask(
        address _execAddress,
        bytes4 _execSelector,
        address _resolverAddress,
        bytes calldata _resolverData
    ) external {
        bytes32 _task = getTaskId(msg.sender, _execAddress, _execSelector);

        require(
            calleeOfTask[_task] == address(0),
            "PokeMe: createTask: Sender already started task"
        );

    _createdTasks[msg.sender].add(_task);
    calleeOfTask[_task] = msg.sender;
    execAddresses[_task] = _execAddress;

        emit TaskCreated(msg.sender, _execAddress, _execSelector, _resolverAddress, _task, _resolverData);
    }

    function cancelTask(bytes32 _task) external {
        require(
            calleeOfTask[_task] != address(0),
            "PokeMe: cancelTask: Sender did not start task yet"
        );

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
    bytes32 task = getTaskId(_execAddress, _execData.calldataSliceSelector());

    address _callee = calleeOfTask[task];
    require(_callee != address(0), "PokeMe: exec: No task found");

    (bool success, ) = _execAddress.call(_execData);
    require(success, "PokeMe: exec: Execution failed");

    uint256 _balanceOfCallee = balanceOfCallee[_callee][_feeToken];

    balanceOfCallee[_callee][_feeToken] = _balanceOfCallee - _txFee;

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

    function exec(
        uint256 _txFee,
        address _feeToken,
        address _callee,
        address _execAddress,
        bytes calldata _execData
    ) external onlyGelato() {
        bytes32 task = getTaskId(
            _callee,
            _execAddress,
            _execData.calldataSliceSelector()
        );

        address callee = calleeOfTask[task];
        require(callee == _callee, "PokeMe: exec: No task found");

    if (!_tokenCredits[msg.sender].contains(_token))
      _tokenCredits[msg.sender].add(_token);

        TaskTreasury(taskTreasury).useFunds(_feeToken, _txFee, callee);

        emit ExecSuccess(_txFee, _feeToken, _execAddress, _execData);
    }

    function getTaskId(
        address _callee,
        address _execAddress,
        bytes4 _selector
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(_callee, _execAddress, _selector));
    }

    /// @dev Example: "transferFrom(address,address,uint256)" => 0x23b872dd
    function getSelector(string calldata _func) external pure returns (bytes4) {
        return bytes4(keccak256(bytes(_func)));
    }

    function getTaskIdsByUser(address _callee) external view returns(bytes32[] memory) {
        uint256 length = _createdTasks[_callee].length();
        bytes32[] memory taskIds = new bytes32[](length);

        for (uint256 i; i < length; i++) {
            taskIds[i] = _createdTasks[_callee].at(i);
        }

        return taskIds;
    }

}
