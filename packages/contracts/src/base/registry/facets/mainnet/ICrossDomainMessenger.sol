// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

interface ICrossDomainMessenger {
    event FailedRelayedMessage(bytes32 indexed msgHash);
    event RelayedMessage(bytes32 indexed msgHash);
    event SentMessage(
        address indexed target,
        address sender,
        bytes message,
        uint256 messageNonce,
        uint256 gasLimit
    );
    event SentMessageExtension1(address indexed sender, uint256 value);

    function MESSAGE_VERSION() external view returns (uint16);

    function MIN_GAS_CALLDATA_OVERHEAD() external view returns (uint64);

    function MIN_GAS_CONSTANT_OVERHEAD() external view returns (uint64);

    function MIN_GAS_DYNAMIC_OVERHEAD_DENOMINATOR() external view returns (uint64);

    function MIN_GAS_DYNAMIC_OVERHEAD_NUMERATOR() external view returns (uint64);

    function OTHER_MESSENGER() external view returns (address);

    function baseGas(bytes memory _message, uint32 _minGasLimit) external pure returns (uint64);

    function failedMessages(bytes32) external view returns (bool);

    function messageNonce() external view returns (uint256);

    function relayMessage(
        uint256 _nonce,
        address _sender,
        address _target,
        uint256 _value,
        uint256 _minGasLimit,
        bytes memory _message
    ) external payable;

    function sendMessage(
        address _target,
        bytes memory _message,
        uint32 _minGasLimit
    ) external payable;

    function successfulMessages(bytes32) external view returns (bool);

    function xDomainMessageSender() external view returns (address);
}
