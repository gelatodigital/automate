// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.12;

import {Gelatofied} from "./vendor/gelato/Gelatofied.sol";
import {GelatoBytes} from "./vendor/gelato/GelatoBytes.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {OpsStorage} from "./OpsStorage.sol";
import {
    ITaskTreasuryUpgradable
} from "./interfaces/ITaskTreasuryUpgradable.sol";
import {IOps} from "./interfaces/IOps.sol";
import {LibTaskId} from "./libraries/LibTaskId.sol";
import {LibDataTypes} from "./libraries/LibDataTypes.sol";
import {LibEvents} from "./libraries/LibEvents.sol";

// solhint-disable max-line-length
// solhint-disable not-rely-on-time
/// @notice Ops enables everyone to communicate to Gelato Bots to monitor and execute certain transactions
/// @notice ResolverAddresses determine when Gelato should execute and provides bots with
/// the payload they should use to execute
/// @notice ExecAddress determine the actual contracts to execute a function on
contract Ops is LibTaskId, Gelatofied, OpsStorage, IOps {
    using GelatoBytes for bytes;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    // solhint-disable const-name-snakecase
    string public constant version = "4";
    ITaskTreasuryUpgradable public immutable override taskTreasury;

    constructor(address payable _gelato, ITaskTreasuryUpgradable _taskTreasury)
        Gelatofied(_gelato)
    {
        taskTreasury = _taskTreasury;
    }

    /// @notice Execution API called by Gelato
    /// @param _txFee Fee paid to Gelato for execution, deducted on the TaskTreasury
    /// @param _feeToken Token used to pay for the execution. ETH = 0xeeeeee...
    /// @param _taskCreator On which contract should Gelato check when to execute the tx
    /// @param _useTaskTreasuryFunds If msg.sender's balance on TaskTreasury should pay for the tx
    /// @param _revertOnFailure To revert or not if call to execAddress fails
    /// @param _execAddress On which contract should Gelato execute the tx
    /// @param _execData Data used to execute the tx, queried from the Resolver by Gelato
    // solhint-disable function-max-lines
    // solhint-disable code-complexity
    function exec(
        uint256 _txFee,
        address _feeToken,
        address _taskCreator,
        bool _useTaskTreasuryFunds,
        bool _revertOnFailure,
        bytes32 _resolverHash,
        address _execAddress,
        bytes calldata _execData
    ) external override onlyGelato {
        bytes32 taskId = getTaskId(
            _taskCreator,
            _execAddress,
            _execData.calldataSliceSelector(),
            _useTaskTreasuryFunds,
            _useTaskTreasuryFunds ? address(0) : _feeToken,
            _resolverHash
        );

        require(
            _taskCreator != address(0) && taskCreator[taskId] == _taskCreator,
            "Ops: exec: No task found"
        );

        if (!_useTaskTreasuryFunds) {
            fee = _txFee;
            feeToken = _feeToken;
        }

        _updateTime(taskId);

        (bool success, bytes memory returnData) = _execAddress.call(_execData);

        // For off-chain simultaion
        if (!success && _revertOnFailure)
            returnData.revertWithError("Ops.exec:");

        if (_useTaskTreasuryFunds) {
            taskTreasury.useFunds(_taskCreator, _feeToken, _txFee);
        } else {
            delete fee;
            delete feeToken;
        }

        emit LibEvents.ExecSuccess(
            _txFee,
            _feeToken,
            _execAddress,
            _execData,
            taskId,
            success
        );
    }

    /// @notice Helper func to query fee and feeToken
    function getFeeDetails() external view override returns (uint256, address) {
        return (fee, feeToken);
    }

    /// @notice Helper func to query all open tasks by a task creator
    /// @param _taskCreator Address who created the task
    function getTaskIdsByUser(address _taskCreator)
        external
        view
        override
        returns (bytes32[] memory)
    {
        uint256 length = _createdTasks[_taskCreator].length();
        bytes32[] memory taskIds = new bytes32[](length);

        for (uint256 i; i < length; i++) {
            taskIds[i] = _createdTasks[_taskCreator].at(i);
        }

        return taskIds;
    }

    /// @notice Create a timed task that executes every so often based on the inputted interval
    /// @param _startTime Timestamp when the first task should become executable. 0 for right now
    /// @param _interval After how many seconds should each task be executed
    /// @param _execAddress On which contract should Gelato execute the transactions
    /// @param _execSelector Which function Gelato should eecute on the _execAddress
    /// @param _resolverAddress On which contract should Gelato check when to execute the tx
    /// @param _resolverData Which data should be used to check on the Resolver when to execute the tx
    /// @param _feeToken Which token to use as fee payment for no prepayment option. Otherwise use address(0).
    function createTimedTask(
        uint128 _startTime,
        uint128 _interval,
        address _execAddress,
        bytes4 _execSelector,
        address _resolverAddress,
        bytes calldata _resolverData,
        address _feeToken
    ) public override returns (bytes32 taskId) {
        require(_interval > 0, "Ops: createTimedTask: interval cannot be 0");

        taskId = _createTask(
            msg.sender,
            _execAddress,
            _execSelector,
            _resolverAddress,
            _resolverData,
            _feeToken
        );

        uint128 nextExec = uint256(_startTime) > block.timestamp
            ? _startTime
            : uint128(block.timestamp);

        timedTask[taskId] = LibDataTypes.Time({
            nextExec: nextExec,
            interval: _interval
        });
        emit LibEvents.TimerSet(taskId, nextExec, _interval);
    }

    /// @notice Create a task that tells Gelato to monitor and execute transactions on specific contracts
    /// @dev Requires funds to be added in Task Treasury, assumes treasury sends fee to Gelato via Ops
    /// @param _execAddress On which contract should Gelato execute the transactions
    /// @param _execSelector Which function Gelato should eecute on the _execAddress
    /// @param _resolverAddress On which contract should Gelato check when to execute the tx
    /// @param _resolverData Which data should be used to check on the Resolver when to execute the tx
    function createTask(
        address _execAddress,
        bytes4 _execSelector,
        address _resolverAddress,
        bytes calldata _resolverData
    ) public override returns (bytes32 taskId) {
        taskId = _createTask(
            msg.sender,
            _execAddress,
            _execSelector,
            _resolverAddress,
            _resolverData,
            address(0)
        );
    }

    /// @notice Create a task that tells Gelato to monitor and execute transactions on specific contracts
    /// @dev Requires no funds to be added in Task Treasury, assumes tasks sends fee to Gelato directly
    /// @param _execAddress On which contract should Gelato execute the transactions
    /// @param _execSelector Which function Gelato should eecute on the _execAddress
    /// @param _resolverAddress On which contract should Gelato check when to execute the tx
    /// @param _resolverData Which data should be used to check on the Resolver when to execute the tx
    /// @param _feeToken Which token to use as fee payment
    function createTaskNoPrepayment(
        address _execAddress,
        bytes4 _execSelector,
        address _resolverAddress,
        bytes calldata _resolverData,
        address _feeToken
    ) public override returns (bytes32 taskId) {
        taskId = _createTask(
            msg.sender,
            _execAddress,
            _execSelector,
            _resolverAddress,
            _resolverData,
            _feeToken
        );
    }

    /// @notice Cancel a task so that Gelato can no longer execute it
    /// @param _taskId The hash of the task, can be computed using getTaskId()
    function cancelTask(bytes32 _taskId) public override {
        require(
            taskCreator[_taskId] == msg.sender,
            "Ops: cancelTask: Sender did not start task yet"
        );

        _createdTasks[msg.sender].remove(_taskId);
        delete taskCreator[_taskId];
        delete execAddresses[_taskId];

        LibDataTypes.Time memory time = timedTask[_taskId];
        bool isTimedTask = time.nextExec != 0;
        if (isTimedTask) delete timedTask[_taskId];

        emit LibEvents.TaskCancelled(_taskId, msg.sender);
    }

    function _createTask(
        address _taskCreator,
        address _execAddress,
        bytes4 _execSelector,
        address _resolverAddress,
        bytes calldata _resolverData,
        address _feeToken
    ) internal returns (bytes32 taskId) {
        bool useTaskTreasuryFunds = _feeToken == address(0);
        bytes32 resolverHash = getResolverHash(_resolverAddress, _resolverData);

        taskId = getTaskId(
            _taskCreator,
            _execAddress,
            _execSelector,
            useTaskTreasuryFunds,
            _feeToken,
            resolverHash
        );

        require(
            taskCreator[taskId] == address(0),
            "Ops: _createTask: Sender already started task"
        );

        _createdTasks[_taskCreator].add(taskId);
        taskCreator[taskId] = _taskCreator;
        execAddresses[taskId] = _execAddress;

        emit LibEvents.TaskCreated(
            _taskCreator,
            _execAddress,
            _execSelector,
            _resolverAddress,
            taskId,
            _resolverData,
            useTaskTreasuryFunds,
            _feeToken,
            resolverHash
        );
    }

    function _updateTime(bytes32 task) internal {
        LibDataTypes.Time memory time = timedTask[task];
        bool isTimedTask = time.nextExec != 0;

        if (isTimedTask) {
            require(
                time.nextExec <= uint128(block.timestamp),
                "Ops: _updateTime: Too early"
            );
            // If next execution would also be executed right now, skip forward to
            // the next execution in the future
            uint128 timeDiff = uint128(block.timestamp) - time.nextExec;
            uint128 intervals = timeDiff / time.interval + 1;

            timedTask[task].nextExec =
                time.nextExec +
                (intervals * time.interval);
        }
    }
}
