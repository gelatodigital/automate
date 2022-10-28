// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {IOps} from "../interfaces/IOps.sol";
import {
    ITaskTreasuryUpgradable
} from "../interfaces/ITaskTreasuryUpgradable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// solhint-disable max-line-length
// solhint-disable max-states-count
// solhint-disable not-rely-on-time
/// @notice Contract to interact with Gelato Ops on a smart contract level
/// @notice Includes example of creating tasks in solidity that increments a counter
contract TaskCreator is Ownable {
    uint256 public counter;
    bool public shouldExec;
    bytes32 public taskId;
    address public ops; // address to be found in the docs
    address payable public treasury; // address to be found in the docs
    address public forwarder; // address to be found in the docs

    event LogTaskId(bytes32 indexed taskId);

    // solhint-disable-next-line no-empty-blocks
    constructor(
        address _ops,
        address payable _treasury,
        address _forwarder
    ) {
        ops = _ops;
        treasury = _treasury;
        forwarder = _forwarder;
    }

    // ######## Gelato specific ########

    /// @notice Create a resolver based task with this smart contract being the owner
    function createResolverTask() external onlyOwner {
        taskId = IOps(ops).createTask(
            address(this),
            this.incrementCounter.selector,
            address(this),
            abi.encodeWithSelector(this.checker.selector)
        );
        emit LogTaskId(taskId);
    }

    /// @notice Create a time based task with this smart contract being the owner
    function createTimedTask() external onlyOwner {
        taskId = IOps(ops).createTimedTask(
            uint128(block.timestamp), // start checking now
            3600, // execute every hour
            address(this),
            this.incrementCounter.selector,
            forwarder,
            abi.encodeWithSelector(this.checker.selector),
            address(0), // as we use Gelato balance, no need to specifiy
            true // use Gelato balance
        );
        emit LogTaskId(taskId);
    }

    /// @notice Cancel a task
    /// @param _taskId Task id to cancel
    function cancelTask(bytes32 _taskId) external onlyOwner {
        IOps(ops).cancelTask(_taskId);
    }

    /// @notice Deposit funds into this contracts Gelato balance
    /// @param _amount Amount to deposit
    /// @param _token Use 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for the network token
    function deposit(uint256 _amount, address _token)
        external
        payable
        onlyOwner
    {
        ITaskTreasuryUpgradable(treasury).depositFunds{value: _amount}(
            address(this),
            _token,
            _amount
        );
    }

    /// @notice Withdraws funds from Gelato and transfers them to owner
    /// @param _amount Amount to withdraw
    /// @param _token Use 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for the network token
    function withdraw(uint256 _amount, address _token) external onlyOwner {
        ITaskTreasuryUpgradable(treasury).withdrawFunds(
            payable(owner()),
            _token,
            _amount
        );
    }

    // ######## Use Case specific ########

    /// @notice Increments a counter
    /// @param _amount Amount to increment the counter
    function incrementCounter(uint256 _amount) external {
        counter += _amount;
    }

    /// @notice Checker function which is called off-chain by Gelato
    function checker()
        public
        view
        returns (bool canExec, bytes memory execData)
    {
        if (!shouldExec) return (false, bytes("should execute is false"));
        return (
            true,
            abi.encodeWithSelector(this.incrementCounter.selector, 10)
        );
    }
}
