// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces
import {IMembership} from "contracts/src/spaces/facets/membership/IMembership.sol";

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {MembershipFacet} from "contracts/src/spaces/facets/membership/MembershipFacet.sol";
import {FacetHelper} from "@towns-protocol/diamond/scripts/common/helpers/FacetHelper.s.sol";

contract DeployMembership is Deployer, FacetHelper {
  constructor() {
    // Funds

    addSelector(IMembership.revenue.selector);

    // Minting
    addSelector(IMembership.joinSpace.selector);
    addSelector(IMembership.joinSpaceWithReferral.selector);
    addSelector(IMembership.renewMembership.selector);

    addSelector(IMembership.expiresAt.selector);

    // Duration
    addSelector(IMembership.getMembershipDuration.selector);

    // Pricing Module
    addSelector(IMembership.setMembershipPricingModule.selector);
    addSelector(IMembership.getMembershipPricingModule.selector);

    // Pricing
    addSelector(IMembership.setMembershipPrice.selector);
    addSelector(IMembership.getMembershipPrice.selector);
    addSelector(IMembership.getMembershipRenewalPrice.selector);
    addSelector(IMembership.getProtocolFee.selector);

    // Allocation
    addSelector(IMembership.setMembershipFreeAllocation.selector);
    addSelector(IMembership.getMembershipFreeAllocation.selector);

    // Limits
    addSelector(IMembership.setMembershipLimit.selector);
    addSelector(IMembership.getMembershipLimit.selector);

    // Currency
    addSelector(IMembership.getMembershipCurrency.selector);

    // Image
    addSelector(IMembership.setMembershipImage.selector);
    addSelector(IMembership.getMembershipImage.selector);

    // Factory
    addSelector(IMembership.getSpaceFactory.selector);
  }

  function versionName() public pure override returns (string memory) {
    return "facets/membershipFacet";
  }

  function __deploy(address deployer) public override returns (address) {
    vm.startBroadcast(deployer);
    address membership = address(new MembershipFacet());
    vm.stopBroadcast();

    return membership;
  }
}
