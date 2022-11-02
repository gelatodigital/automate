// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.14;

import {
    SafeERC20,
    IERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {OpsReady} from "../OpsReady.sol";

abstract contract CreatorBase is OpsReady {
    enum Module {
        RESOLVER,
        TIME,
        PROXY,
        SINGLE_EXEC
    }

    struct ModuleData {
        Module[] modules;
        bytes[] args;
    }

    address public immutable owner;
    IOps internal immutable _ops;
    ITaskTreasury private immutable _taskTreasury;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address __ops, address _owner) OpsReady(__ops, address(this)) {
        owner = _owner;
        _ops = IOps(__ops);
        _taskTreasury = ITaskTreasury(IOps(__ops).taskTreasury());
    }

    function withdrawFunds(uint256 _amount, address _token) external onlyOwner {
        _taskTreasury.withdrawFunds(payable(owner), _token, _amount);
    }

    function depositFunds(uint256 _amount, address _token) public payable {
        _taskTreasury.depositFunds{value: _amount}(
            address(this),
            _token,
            _amount
        );
    }

    function _cancelTask(bytes32 _taskId) internal {
        _ops.cancelTask(_taskId);
    }
}

interface IOps {
    function createTask(
        address execAddress,
        bytes calldata execData,
        CreatorBase.ModuleData calldata moduleData,
        address feeToken
    ) external returns (bytes32 taskId);

    function cancelTask(bytes32 taskId) external;

    function taskTreasury() external view returns (ITaskTreasury);
}

interface ITaskTreasury {
    function depositFunds(
        address receiver,
        address token,
        uint256 amount
    ) external payable;

    function withdrawFunds(
        address payable receiver,
        address token,
        uint256 amount
    ) external;
}
