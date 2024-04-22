// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.19 <0.9.0;

import {Strings} from "openzeppelin-contracts/utils/Strings.sol";
import "../utils/Contracts.t.sol";
import {GelatoVRFConsumer} from "./vrf/GelatoVRFConsumer.sol";
import {
    AutomateModuleHelper
} from "../../../contracts/integrations/AutomateModuleHelper.sol";
import {LibDataTypes} from "../../../contracts/libraries/LibDataTypes.sol";
import {IGelatoVRFConsumer} from "./vrf/IGelatoVRFConsumer.sol";
import {IOpsProxy} from "../../../contracts/interfaces/IOpsProxy.sol";
import {
    IGelato1Balance
} from "../../../contracts/interfaces/IGelato1Balance.sol";

contract VRFGasReport is AutomateModuleHelper, Contracts {
    address internal _dedicatedMsgSender;
    GelatoVRFConsumer internal _gelatoVRFConsumer;

    constructor() Contracts() {}

    /*//////////////////////////////////////////////////////////////
                            SET-UP FUNCTION
    //////////////////////////////////////////////////////////////*/
    function setUp() public override {
        // Fork network before deploying contracts.
        _fork("mumbai", 43_277_610);

        super.setUp();

        _dedicatedMsgSender = opsProxyFactory.determineProxyAddress(
            _users.user
        );

        _gelatoVRFConsumer = new GelatoVRFConsumer(_dedicatedMsgSender);
    }

    /*//////////////////////////////////////////////////////////////
                                TESTS
    //////////////////////////////////////////////////////////////*/

    function testCreateTaskVRF() public {
        _createTaskVRF();
    }

    /**
     * @dev Utilising exec1Balance
     * execData is dedicatedMsgSender's `batchExecuteCall` per current design
     */
    function testExec1Balance() public {
        _createTaskVRF();
        bytes
            memory fulfillRandomnessData = _requestRandomnessAndGenerateFulfillRandomnessData();

        // Form dedicatedMsgSender execData
        address[] memory tos = new address[](1);
        tos[0] = address(_gelatoVRFConsumer);

        bytes[] memory datas = new bytes[](1);
        datas[0] = fulfillRandomnessData;

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes memory execData = abi.encodeWithSelector(
            IOpsProxy.batchExecuteCall.selector,
            tos,
            datas,
            values
        );

        vm.prank(_users.gelato);
        automate.exec1Balance(
            _users.user,
            _dedicatedMsgSender,
            execData,
            _vrfModuleData(),
            _mock1BalanceParam(),
            true
        );
    }

    /**
     * @dev Utilising exec1BalanceSimple
     * execData is dedicatedMsgSender's `executeCall`
     */
    function testExec1BalanceSimple() public {
        bytes32 taskId = _createTaskVRF();
        bytes
            memory fulfillRandomnessData = _requestRandomnessAndGenerateFulfillRandomnessData();

        // Form dedicatedMsgSender execData
        bytes memory execData = abi.encodeWithSelector(
            IOpsProxy.executeCall.selector,
            address(_gelatoVRFConsumer),
            fulfillRandomnessData,
            0
        );

        vm.prank(_users.gelato);
        automate.exec1BalanceSimple(
            _users.user,
            _dedicatedMsgSender,
            taskId,
            _mockCorrelationId(),
            execData,
            true,
            false
        );
    }

    /*//////////////////////////////////////////////////////////////
                        PRIVATE HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _createTaskVRF() private returns (bytes32 taskId) {
        vm.prank(_users.user);
        taskId = automate.createTask(
            _dedicatedMsgSender,
            abi.encodePacked(IOpsProxy.batchExecuteCall.selector),
            _vrfModuleData(),
            address(0)
        );
    }

    function _vrfModuleData()
        private
        view
        returns (LibDataTypes.ModuleData memory moduleData)
    {
        moduleData = LibDataTypes.ModuleData({
            modules: new LibDataTypes.Module[](3),
            args: new bytes[](3)
        });
        moduleData.modules[0] = LibDataTypes.Module.PROXY;
        moduleData.modules[1] = LibDataTypes.Module.WEB3_FUNCTION;
        moduleData.modules[2] = LibDataTypes.Module.TRIGGER;

        moduleData.args[0] = _proxyModuleArg();

        string
            memory web3FunctionHash = "QmWm8Uq2UYRAVwFyzWop2Hghj56WhJk7K8hGGC2Jy7rzDo";
        string memory consumerAddressStr = Strings.toHexString(
            address(_gelatoVRFConsumer)
        );
        bytes memory web3FunctionArgsHex = abi.encode(consumerAddressStr);
        moduleData.args[1] = _web3FunctionModuleArg(
            web3FunctionHash,
            web3FunctionArgsHex
        );

        bytes32[][] memory topics = new bytes32[][](1);
        topics[0] = new bytes32[](1);
        topics[0][0] = keccak256("RequestedRandomness(uint256,bytes)");
        uint256 blockConfirmations = block.chainid == 1 ? 1 : 0;
        moduleData.args[2] = _eventTriggerModuleArg(
            address(_gelatoVRFConsumer),
            topics,
            blockConfirmations
        );
    }

    function _requestRandomnessAndGenerateFulfillRandomnessData()
        private
        returns (bytes memory fulfillRandomnessData)
    {
        uint256 randomness = 0x471403f3a8764edd4d39c7748847c07098c05e5a16ed7b083b655dbab9809fae;
        uint256 requestId = _requestRandomness();

        // Form VRF fulfillRandomnessData
        bytes memory extraData = abi.encode(
            requestId,
            block.timestamp,
            block.number
        );
        bytes memory data = abi.encode(requestId, extraData);
        bytes memory dataWithRound = abi.encode(_round(), data);

        fulfillRandomnessData = abi.encodeWithSelector(
            IGelatoVRFConsumer.fulfillRandomness.selector,
            randomness,
            dataWithRound
        );
    }

    function _requestRandomness() private returns (uint256 requestId) {
        requestId = _gelatoVRFConsumer.nonce();

        vm.prank(_users.user);
        _gelatoVRFConsumer.requestRandomness(1);
    }

    function _round() private view returns (uint256 round) {
        uint256 period = 3;
        uint256 genesis = 1692803367;

        // solhint-disable-next-line not-rely-on-time
        uint256 elapsedFromGenesis = block.timestamp - genesis;
        uint256 currentRound = (elapsedFromGenesis / period) + 1;

        round = block.chainid == 1 ? currentRound + 4 : currentRound + 1;
    }

    function _mock1BalanceParam()
        private
        view
        returns (IGelato1Balance.Gelato1BalanceParam memory oneBalanceParam)
    {
        oneBalanceParam = IGelato1Balance.Gelato1BalanceParam({
            sponsor: _users.user,
            feeToken: address(0),
            oneBalanceChainId: 5,
            nativeToFeeTokenXRateNumerator: 1,
            nativeToFeeTokenXRateDenominator: 1,
            correlationId: _mockCorrelationId()
        });
    }

    function _mockCorrelationId() private view returns (bytes32 correlationId) {
        correlationId = keccak256("correlationId");
    }
}
