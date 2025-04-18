// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {FacetHelper} from "@towns-protocol/diamond/scripts/common/helpers/FacetHelper.s.sol";
import {Deployer} from "scripts/common/Deployer.s.sol";
import {PlatformRequirementsFacet} from "src/factory/facets/platform/requirements/PlatformRequirementsFacet.sol";

contract DeployPlatformRequirements is FacetHelper, Deployer {
    constructor() {
        addSelector(PlatformRequirementsFacet.getFeeRecipient.selector);
        addSelector(PlatformRequirementsFacet.getMembershipBps.selector);
        addSelector(PlatformRequirementsFacet.getMembershipFee.selector);
        addSelector(PlatformRequirementsFacet.getMembershipMintLimit.selector);
        addSelector(PlatformRequirementsFacet.getMembershipDuration.selector);
        addSelector(PlatformRequirementsFacet.setFeeRecipient.selector);
        addSelector(PlatformRequirementsFacet.setMembershipBps.selector);
        addSelector(PlatformRequirementsFacet.setMembershipFee.selector);
        addSelector(PlatformRequirementsFacet.setMembershipMintLimit.selector);
        addSelector(PlatformRequirementsFacet.setMembershipDuration.selector);
        addSelector(PlatformRequirementsFacet.setMembershipMinPrice.selector);
        addSelector(PlatformRequirementsFacet.getMembershipMinPrice.selector);
        addSelector(PlatformRequirementsFacet.getDenominator.selector);
        addSelector(PlatformRequirementsFacet.setSwapFees.selector);
        addSelector(PlatformRequirementsFacet.getSwapFees.selector);
        addSelector(PlatformRequirementsFacet.setRouterWhitelisted.selector);
        addSelector(PlatformRequirementsFacet.isRouterWhitelisted.selector);
    }

    function versionName() public pure override returns (string memory) {
        return "facets/platformRequirementsFacet";
    }

    function __deploy(address deployer) internal override returns (address) {
        vm.startBroadcast(deployer);
        PlatformRequirementsFacet facet = new PlatformRequirementsFacet();
        vm.stopBroadcast();
        return address(facet);
    }

    function initializer() public pure override returns (bytes4) {
        return PlatformRequirementsFacet.__PlatformRequirements_init.selector;
    }

    function makeInitData(
        address feeRecipient,
        uint16 membershipBps,
        uint256 membershipFee,
        uint256 membershipMintLimit,
        uint64 membershipDuration,
        uint256 membershipMinPrice
    ) public pure returns (bytes memory) {
        return
            abi.encodeWithSelector(
                PlatformRequirementsFacet.__PlatformRequirements_init.selector,
                feeRecipient,
                membershipBps,
                membershipFee,
                membershipMintLimit,
                membershipDuration,
                membershipMinPrice
            );
    }
}
