// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

import { Gelatofied } from "./Gelatofied.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract PokeMe is ReentrancyGuard, Gelatofied {
  using SafeMath for uint256;

  mapping(bytes32 => address) public calleeOfTask;
  mapping(address => uint256) public balanceOfCallee;

  constructor(address payable _gelato) Gelatofied(_gelato) {}

  event TaskCreated(bytes taskData, address taskAddress);

  function createTask(bytes calldata _taskData, address _taskAddress) external {
    bytes32 _task = keccak256(abi.encode(_taskData, _taskAddress));

    require(
      calleeOfTask[_task] == address(0),
      "PokeMe: createTask: Sender already started task"
    );

    calleeOfTask[_task] = msg.sender;

    emit TaskCreated(_taskData, _taskAddress);
  }

  function cancelTask(bytes calldata _taskData, address _taskAddress) external {
    bytes32 _task = keccak256(abi.encode(_taskData, _taskAddress));

    require(
      calleeOfTask[_task] != address(0),
      "PokeMe: cancelTask: Sender did not start task yet"
    );

    delete calleeOfTask[_task];
  }

  function exec(
    bytes calldata _taskData,
    address _taskAddress,
    uint256 _txFee
  ) external gelatofy(_txFee, ETH) {
    bytes32 _task = keccak256(abi.encode(_taskData, _taskAddress));

    address _callee = calleeOfTask[_task];
    require(_callee != address(0), "PokeMe: exec: No task found");

    (bool success, ) = _taskAddress.call(_taskData);
    require(success, "PokeMe: exec: Execution failed");

    uint256 _balanceOfCallee = balanceOfCallee[_callee];

    balanceOfCallee[_callee] = _balanceOfCallee.sub(_txFee);
  }

  function depositFunds(address _receiver) external payable {
    require(msg.value != 0, "PokeMe: depositFunds: No ether sent");

    balanceOfCallee[_receiver] = balanceOfCallee[_receiver].add(msg.value);
  }

  function withdrawFunds(uint256 _amount) external nonReentrant {
    uint256 balance = balanceOfCallee[msg.sender];

    require(
      balance >= _amount,
      "PokeMe: withdrawFunds: Sender has insufficient balance"
    );

    balanceOfCallee[msg.sender] = balance.sub(_amount);

    (bool success, ) = msg.sender.call{ value: _amount }("");
    require(success, "PokeMe: withdrawFunds: Withdraw funds failed");
  }
}
