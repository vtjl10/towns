// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {MembershipMetadata} from "contracts/src/spaces/facets/membership/metadata/MembershipMetadata.sol";
import {FacetHelper} from "@towns-protocol/diamond/scripts/common/helpers/FacetHelper.s.sol";

contract DeployMembershipMetadata is Deployer, FacetHelper {
  constructor() {
    addSelector(MembershipMetadata.refreshMetadata.selector);
    addSelector(MembershipMetadata.tokenURI.selector);
  }

  function versionName() public pure override returns (string memory) {
    return "facets/membershipMetadataFacet";
  }

  function __deploy(address deployer) public override returns (address) {
    vm.startBroadcast(deployer);
    MembershipMetadata membershipMetadata = new MembershipMetadata();
    vm.stopBroadcast();
    return address(membershipMetadata);
  }
}
