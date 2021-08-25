// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

import {Gelatofied} from "./Gelato/Gelatofied.sol";
import {GelatoBytes} from "./Gelato/GelatoBytes.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {
    SafeERC20,
    IERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {TaskTreasury} from "./TaskTreasury/TaskTreasury.sol";

// solhint-disable max-line-length
// solhint-disable max-states-count
/// @notice PokeMe enables everyone to communicate to Gelato Bots to monitor and execute certain transactions
/// @notice ResolverAddresses determine when Gelato should execute and provides bots with
/// the payload they should use to execute
/// @notice ExecAddress determine the actual contracts to execute a function on
contract PokeMe is Gelatofied {
    using SafeERC20 for IERC20;
    using GelatoBytes for bytes;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    // solhint-disable const-name-snakecase
    string public constant version = "3";
    mapping(bytes32 => address) public taskCreator;
    mapping(bytes32 => address) public execAddresses;
    mapping(address => EnumerableSet.Bytes32Set) internal _createdTasks;
    address public immutable taskTreasury;
    uint256 public fee;
    address public feeToken;

    constructor(address payable _gelato, address _taskTreasury)
        Gelatofied(_gelato)
    {
        taskTreasury = _taskTreasury;
    }

    event TaskCreated(
        address taskCreator,
        address execAddress,
        bytes4 selector,
        address resolverAddress,
        bytes32 taskId,
        bytes resolverData,
        bool useTaskTreasuryFunds,
        address feeToken,
        bytes32 resolverHash
    );
    event TaskCancelled(bytes32 taskId, address taskCreator);
    event ExecSuccess(
        uint256 indexed txFee,
        address indexed feeToken,
        address indexed execAddress,
        bytes execData,
        bytes32 taskId
    );

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
    ) external {
        bytes32 resolverHash = getResolverHash(_resolverAddress, _resolverData);
        bytes32 task = getTaskId(
            msg.sender,
            _execAddress,
            _execSelector,
            false,
            _feeToken,
            resolverHash
        );

        require(
            taskCreator[task] == address(0),
            "PokeMe: createTask: Sender already started task"
        );

        _createdTasks[msg.sender].add(task);
        taskCreator[task] = msg.sender;
        execAddresses[task] = _execAddress;

        emit TaskCreated(
            msg.sender,
            _execAddress,
            _execSelector,
            _resolverAddress,
            task,
            _resolverData,
            false,
            _feeToken,
            resolverHash
        );
    }

    /// @notice Create a task that tells Gelato to monitor and execute transactions on specific contracts
    /// @dev Requires funds to be added in Task Treasury, assumes treasury sends fee to Gelato via PokeMe
    /// @param _execAddress On which contract should Gelato execute the transactions
    /// @param _execSelector Which function Gelato should eecute on the _execAddress
    /// @param _resolverAddress On which contract should Gelato check when to execute the tx
    /// @param _resolverData Which data should be used to check on the Resolver when to execute the tx
    function createTask(
        address _execAddress,
        bytes4 _execSelector,
        address _resolverAddress,
        bytes calldata _resolverData
    ) external {
        bytes32 resolverHash = getResolverHash(_resolverAddress, _resolverData);
        bytes32 task = getTaskId(
            msg.sender,
            _execAddress,
            _execSelector,
            true,
            address(0),
            resolverHash
        );

        require(
            taskCreator[task] == address(0),
            "PokeMe: createTask: Sender already started task"
        );

        _createdTasks[msg.sender].add(task);
        taskCreator[task] = msg.sender;
        execAddresses[task] = _execAddress;

        emit TaskCreated(
            msg.sender,
            _execAddress,
            _execSelector,
            _resolverAddress,
            task,
            _resolverData,
            true,
            address(0),
            resolverHash
        );
    }

    /// @notice Cancel a task so that Gelato can no longer execute it
    /// @param _taskId The hash of the task, can be computed using getTaskId()
    function cancelTask(bytes32 _taskId) external {
        require(
            taskCreator[_taskId] == msg.sender,
            "PokeMe: cancelTask: Sender did not start task yet"
        );

        _createdTasks[msg.sender].remove(_taskId);
        delete taskCreator[_taskId];
        delete execAddresses[_taskId];

        emit TaskCancelled(_taskId, msg.sender);
    }

    /// @notice Execution API called by Gelato
    /// @param _txFee Fee paid to Gelato for execution, deducted on the TaskTreasury
    /// @param _feeToken Token used to pay for the execution. ETH = 0xeeeeee...
    /// @param _taskCreator On which contract should Gelato check when to execute the tx
    /// @param _useTaskTreasuryFunds If msg.sender's balance on TaskTreasury should pay for the tx
    /// @param _execAddress On which contract should Gelato execute the tx
    /// @param _execData Data used to execute the tx, queried from the Resolver by Gelato
    // solhint-disable function-max-lines
    function exec(
        uint256 _txFee,
        address _feeToken,
        address _taskCreator,
        bool _useTaskTreasuryFunds,
        bytes32 _resolverHash,
        address _execAddress,
        bytes calldata _execData
    ) external onlyGelato {
        if (!_useTaskTreasuryFunds) {
            fee = _txFee;
            feeToken = _feeToken;
        }
        bytes32 task = getTaskId(
            _taskCreator,
            _execAddress,
            _execData.calldataSliceSelector(),
            _useTaskTreasuryFunds,
            _useTaskTreasuryFunds ? address(0) : _feeToken,
            _resolverHash
        );

        require(
            taskCreator[task] == _taskCreator,
            "PokeMe: exec: No task found"
        );

        (bool success, ) = _execAddress.call(_execData);
        require(success, "PokeMe: exec: Execution failed");

        if (_useTaskTreasuryFunds) {
            TaskTreasury(taskTreasury).useFunds(
                _feeToken,
                _txFee,
                _taskCreator
            );
        } else {
            delete fee;
            delete feeToken;
        }

        emit ExecSuccess(_txFee, _feeToken, _execAddress, _execData, task);
    }

    /// @notice Returns TaskId of a task Creator
    /// @param _taskCreator Address of the task creator
    /// @param _execAddress Address of the contract to be executed by Gelato
    /// @param _selector Function on the _execAddress which should be executed
    /// @param _useTaskTreasuryFunds If msg.sender's balance on TaskTreasury should pay for the tx
    /// @param _feeToken FeeToken to use, address 0 if task treasury is used
    /// @param _resolverHash hash of resolver address and data
    function getTaskId(
        address _taskCreator,
        address _execAddress,
        bytes4 _selector,
        bool _useTaskTreasuryFunds,
        address _feeToken,
        bytes32 _resolverHash
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    _taskCreator,
                    _execAddress,
                    _selector,
                    _useTaskTreasuryFunds,
                    _feeToken,
                    _resolverHash
                )
            );
    }

    /// @notice Helper func to query the _selector of a function you want to automate
    /// @param _func String of the function you want the selector from
    /// @dev Example: "transferFrom(address,address,uint256)" => 0x23b872dd
    function getSelector(string calldata _func) external pure returns (bytes4) {
        return bytes4(keccak256(bytes(_func)));
    }

    /// @notice Helper func to query the resolverHash
    /// @param _resolverAddress Address of resolver
    /// @param _resolverData Data passed to resolver
    function getResolverHash(
        address _resolverAddress,
        bytes memory _resolverData
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(_resolverAddress, _resolverData));
    }

    /// @notice Helper func to query all open tasks by a task creator
    /// @param _taskCreator Address who created the task
    function getTaskIdsByUser(address _taskCreator)
        external
        view
        returns (bytes32[] memory)
    {
        uint256 length = _createdTasks[_taskCreator].length();
        bytes32[] memory taskIds = new bytes32[](length);

        for (uint256 i; i < length; i++) {
            taskIds[i] = _createdTasks[_taskCreator].at(i);
        }

        return taskIds;
    }

    /// @notice Helper func to query fee and feeToken
    function getFeeDetails() external view returns (uint256, address) {
        return (fee, feeToken);
    }
}
