// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

import {ICrossDomainMessenger} from "src/base/registry/facets/mainnet/ICrossDomainMessenger.sol";
import {IMainnetDelegation} from "src/base/registry/facets/mainnet/IMainnetDelegation.sol";

// libraries

// contracts

import {Facet} from "@towns-protocol/diamond/src/facets/Facet.sol";
import {OwnableBase} from "@towns-protocol/diamond/src/facets/ownable/OwnableBase.sol";
import {MainnetDelegationBase} from "src/base/registry/facets/mainnet/MainnetDelegationBase.sol";

contract MainnetDelegation is IMainnetDelegation, MainnetDelegationBase, OwnableBase, Facet {
    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                        INITIALIZERS                        */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    function __MainnetDelegation_init(address messenger) external onlyInitializing {
        __MainnetDelegation_init_unchained(messenger);
    }

    function __MainnetDelegation_init_unchained(address messenger) internal {
        _addInterface(type(IMainnetDelegation).interfaceId);
        _setMessenger(ICrossDomainMessenger(messenger));
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                          MODIFIER                          */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    modifier onlyCrossDomainMessenger() {
        ICrossDomainMessenger messenger = _getMessenger();

        require(
            msg.sender == address(messenger) &&
                messenger.xDomainMessageSender() == address(_getProxyDelegation()),
            "MainnetDelegation: sender is not the cross-domain messenger"
        );
        _;
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                       ADMIN FUNCTIONS                      */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    function setProxyDelegation(address proxyDelegation) external onlyOwner {
        _setProxyDelegation(proxyDelegation);
    }

    /// @inheritdoc IMainnetDelegation
    function relayDelegations(bytes calldata encodedMsgs) external onlyOwner {
        _relayDelegations(encodedMsgs);
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                         DELEGATION                         */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    /// @inheritdoc IMainnetDelegation
    function setDelegationDigest(bytes32 digest) external onlyCrossDomainMessenger {
        _setDelegationDigest(digest);
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                          GETTERS                           */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    /// @inheritdoc IMainnetDelegation
    function getMessenger() external view returns (address) {
        return address(_getMessenger());
    }

    /// @inheritdoc IMainnetDelegation
    function getProxyDelegation() external view returns (address) {
        return address(_getProxyDelegation());
    }

    /// @inheritdoc IMainnetDelegation
    function getDepositIdByDelegator(address delegator) external view returns (uint256) {
        return _getDepositIdByDelegator(delegator);
    }

    /// @inheritdoc IMainnetDelegation
    function getDelegationByDelegator(address delegator) external view returns (Delegation memory) {
        return _getDelegationByDelegator(delegator);
    }

    /// @inheritdoc IMainnetDelegation
    function getMainnetDelegationsByOperator(
        address operator
    ) external view returns (Delegation[] memory) {
        return _getMainnetDelegationsByOperator(operator);
    }

    /// @inheritdoc IMainnetDelegation
    function getDelegatedStakeByOperator(address operator) external view returns (uint256) {
        return _getDelegatedStakeByOperator(operator);
    }

    function getAuthorizedClaimer(address owner) external view returns (address) {
        return _getAuthorizedClaimer(owner);
    }
}
