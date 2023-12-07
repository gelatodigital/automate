// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.19 <0.9.0;

import {GelatoVRFConsumerBase} from "./GelatoVRFConsumerBase.sol";

contract GelatoVRFConsumer is GelatoVRFConsumerBase {
    struct Request {
        uint256 requestTime;
        uint256 requestBlock;
        uint256 fulfilledTime;
        uint256 fulfilledBlock;
        uint256 randomness;
    }

    address public immutable dedicatedMsgSender;
    uint256 public nonce;
    mapping(uint256 => mapping(uint256 => Request)) public requests;
    mapping(uint256 => uint256) public nonceFulfilledCount;

    event RandomnessFulfilled(
        uint256 indexed nonce,
        uint256 indexed fulfilledCount,
        Request request
    );

    constructor(address _dedicatedMsgSender) {
        dedicatedMsgSender = _dedicatedMsgSender;
    }

    function _operator() internal view override returns (address) {
        return dedicatedMsgSender;
    }

    function requestRandomness(uint256 _count) external {
        for (uint256 i; i < _count; i++) {
            _requestRandomness(
                abi.encode(nonce, block.timestamp, block.number)
            );
        }
        nonce += 1;
    }

    function _fulfillRandomness(
        uint256 _randomness,
        uint256,
        bytes memory _extraData
    ) internal override {
        (uint256 nonce_, uint256 requestTime, uint256 requestBlock) = abi
            .decode(_extraData, (uint256, uint256, uint256));

        Request memory request = Request(
            requestTime,
            requestBlock,
            block.timestamp,
            block.number,
            _randomness
        );

        uint256 fulfilledCount = nonceFulfilledCount[nonce_];
        uint256 newFulfilledCount = fulfilledCount + 1;

        requests[nonce_][fulfilledCount] = request;
        nonceFulfilledCount[nonce_] = newFulfilledCount;

        emit RandomnessFulfilled(nonce_, newFulfilledCount, request);
    }
}
