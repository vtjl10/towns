// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {FacetHelper} from "@towns-protocol/diamond/scripts/common/helpers/FacetHelper.s.sol";
import {Deployer} from "scripts/common/Deployer.s.sol";
import {EntitlementGated} from "src/spaces/facets/gated/EntitlementGated.sol";

contract DeployEntitlementGated is FacetHelper, Deployer {
    constructor() {
        addSelector(EntitlementGated.postEntitlementCheckResult.selector);
        addSelector(EntitlementGated.getRuleData.selector);
    }

    function initializer() public pure override returns (bytes4) {
        return EntitlementGated.__EntitlementGated_init.selector;
    }

    function versionName() public pure override returns (string memory) {
        return "facets/entitlementGatedFacet";
    }

    function __deploy(address deployer) internal override returns (address) {
        vm.startBroadcast(deployer);
        EntitlementGated facet = new EntitlementGated();
        vm.stopBroadcast();
        return address(facet);
    }
}
