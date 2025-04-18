// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {FacetHelper} from "@towns-protocol/diamond/scripts/common/helpers/FacetHelper.s.sol";
import {Deployer} from "scripts/common/Deployer.s.sol";
import {MainnetDelegation} from "src/base/registry/facets/mainnet/MainnetDelegation.sol";

contract DeployMainnetDelegation is FacetHelper, Deployer {
    constructor() {
        addSelector(MainnetDelegation.setProxyDelegation.selector);
        addSelector(MainnetDelegation.setDelegationDigest.selector);
        addSelector(MainnetDelegation.relayDelegations.selector);
        addSelector(MainnetDelegation.getDelegationByDelegator.selector);
        addSelector(MainnetDelegation.getMainnetDelegationsByOperator.selector);
        addSelector(MainnetDelegation.getDelegatedStakeByOperator.selector);
        addSelector(MainnetDelegation.getAuthorizedClaimer.selector);
        addSelector(MainnetDelegation.getProxyDelegation.selector);
        addSelector(MainnetDelegation.getMessenger.selector);
        addSelector(MainnetDelegation.getDepositIdByDelegator.selector);
    }

    function initializer() public pure override returns (bytes4) {
        return MainnetDelegation.__MainnetDelegation_init.selector;
    }

    function makeInitData(address messenger) public pure returns (bytes memory) {
        return abi.encodeWithSelector(initializer(), messenger);
        // 0xfdf649b20000000000000000000000004200000000000000000000000000000000000007 // Base
        // Sepolia
    }

    function versionName() public pure override returns (string memory) {
        return "facets/mainnetDelegationFacet";
    }

    function __deploy(address deployer) internal override returns (address) {
        vm.startBroadcast(deployer);
        MainnetDelegation facet = new MainnetDelegation();
        vm.stopBroadcast();
        return address(facet);
    }
}
