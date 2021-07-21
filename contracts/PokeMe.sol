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

  event TaskCreated(
    address resolverAddress,
    bytes taskData,
    address taskAddress
  );

  function createTask(
    address _resolverAddress,
    bytes calldata _taskData,
    address _execAddress
  ) external {
    bytes32 _task = keccak256(
      abi.encode(_resolverAddress, _taskData, _execAddress)
    );

    require(
      calleeOfTask[_task] == address(0),
      "PokeMe: createTask: Sender already started task"
    );

    calleeOfTask[_task] = msg.sender;

    emit TaskCreated(_resolverAddress, _taskData, _execAddress);
  }

  function cancelTask(
    address _resolverAddress,
    bytes calldata _taskData,
    address _execAddress
  ) external {
    bytes32 _task = keccak256(
      abi.encode(_resolverAddress, _taskData, _execAddress)
    );

    require(
      calleeOfTask[_task] != address(0),
      "PokeMe: cancelTask: Sender did not start task yet"
    );

    delete calleeOfTask[_task];
  }

  function exec(
    address _resolverAddress,
    bytes calldata _taskData,
    address _execAddress,
    bytes calldata _execData,
    uint256 _txFee
  ) external gelatofy(_txFee, ETH) {
    bytes32 _task = keccak256(
      abi.encode(_resolverAddress, _taskData, _execAddress)
    );

    address _callee = calleeOfTask[_task];
    require(_callee != address(0), "PokeMe: exec: No task found");

    (bool success, ) = _execAddress.call(_execData);
    require(success, "PokeMe: exec: Execution failed");

    uint256 _balanceOfCallee = balanceOfCallee[_callee];

    balanceOfCallee[_callee] = _balanceOfCallee.sub(_txFee);
  }

  function depositFunds() external payable {
    require(msg.value != 0, "PokeMe: depositFunds: No ether sent");

    balanceOfCallee[msg.sender] = balanceOfCallee[msg.sender].add(msg.value);
  }

  function withdrawFunds(uint256 _amount) external nonReentrant {
    uint256 balance = balanceOfCallee[msg.sender];

    require(
      balance >= _amount,
      "PokeMe: withdrawFunds: Sender has insufficient balance"
    );

    (bool success, ) = msg.sender.call{ value: _amount }("");
    require(success, "PokeMe: withdrawFunds: Withdraw funds failed");

    balanceOfCallee[msg.sender] = balance.sub(_amount);
  }
}
