// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { IGelato } from "./interfaces/IGelato.sol";

contract TaskStore is ReentrancyGuard {
  using SafeMath for uint256;

  uint256 public txFee;
  IGelato public immutable gelato;
  mapping(bytes32 => address) public calleeOfTask;
  mapping(address => uint256) public balanceOfSponsor;
  mapping(address => address) public sponsorOfCallee;

  constructor(uint256 _txFee, address _gelato) {
    txFee = _txFee;
    gelato = IGelato(_gelato);
  }

  event TaskCreated(address taskContract, bytes taskData);

  function createTask(address _taskContract, bytes calldata _taskData)
    external
  {
    bytes32 _task = keccak256(abi.encode(_taskContract, _taskData));

    require(
      calleeOfTask[_task] == address(0),
      "TaskStore: createTask: Sender already started task"
    );

    calleeOfTask[_task] = msg.sender;

    emit TaskCreated(_taskContract, _taskData);
  }

  function cancelTask(address _taskContract, bytes calldata _taskData)
    external
  {
    bytes32 _task = keccak256(abi.encode(_taskContract, _taskData));

    require(
      calleeOfTask[_task] != address(0),
      "TaskStore: cancelTask: Sender did not start task yet"
    );

    delete calleeOfTask[_task];
  }

  function exec(address _taskContract, bytes calldata _taskData) external {
    require(gelato.isExecutor(msg.sender), "TaskStore: exec: Only executors");

    bytes32 _task = keccak256(abi.encode(_taskContract, _taskData));

    address _callee = calleeOfTask[_task];
    require(_callee != address(0), "TaskStore: cancelTask: No task found");

    address _sponsor = sponsorOfCallee[_callee];
    require(_sponsor != address(0), "TaskStore: exec: No sponsor");

    uint256 _balanceOfSponsor = balanceOfSponsor[_sponsor];
    require(
      _balanceOfSponsor >= txFee,
      "TaskStore: exec: Sponsor insufficient balance"
    );

    _taskContract.call(_taskData);

    (bool success, ) = msg.sender.call{ value: txFee }("");
    require(success, "TaskStore: exec: Transfer to executor failed");

    balanceOfSponsor[_sponsor] = _balanceOfSponsor.sub(txFee);
  }

  function whitelistCallee(address _callee) external {
    require(
      balanceOfSponsor[msg.sender] > 0,
      "TaskStore: whitelistCallee: Sponsor does not have balance"
    );
    require(
      sponsorOfCallee[_callee] == address(0),
      "TaskStore: whitelistCallee: Callee already have sponsor"
    );

    sponsorOfCallee[_callee] = msg.sender;
  }

  function removeWhitelist(address _callee) external {
    require(
      sponsorOfCallee[_callee] == msg.sender,
      "TaskStore: removeWhitelist: Not sponsor of callee"
    );

    delete sponsorOfCallee[_callee];
  }

  function depositFunds() external payable {
    require(msg.value != 0, "TaskStore: depositFunds: No ether sent");

    balanceOfSponsor[msg.sender] = balanceOfSponsor[msg.sender].add(msg.value);
  }

  function withdrawFunds(uint256 _amount) external nonReentrant {
    uint256 balance = balanceOfSponsor[msg.sender];

    require(
      balance >= _amount,
      "TaskStore: withdrawFunds: Sender has insufficient balance"
    );

    (bool success, ) = msg.sender.call{ value: _amount }("");
    require(success, "TaskStore: withdrawFunds: Withdraw funds failed");

    balanceOfSponsor[msg.sender] = balance.sub(_amount);
  }
}
