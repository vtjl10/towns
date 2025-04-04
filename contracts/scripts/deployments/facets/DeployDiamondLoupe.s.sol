// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {DiamondLoupeFacet} from "@towns-protocol/diamond/src/facets/loupe/DiamondLoupeFacet.sol";
import {FacetHelper} from "@towns-protocol/diamond/scripts/common/helpers/FacetHelper.s.sol";

contract DeployDiamondLoupe is FacetHelper, Deployer {
  constructor() {
    addSelector(DiamondLoupeFacet.facets.selector);
    addSelector(DiamondLoupeFacet.facetAddress.selector);
    addSelector(DiamondLoupeFacet.facetFunctionSelectors.selector);
    addSelector(DiamondLoupeFacet.facetAddresses.selector);
  }

  function initializer() public pure override returns (bytes4) {
    return DiamondLoupeFacet.__DiamondLoupe_init.selector;
  }

  function versionName() public pure override returns (string memory) {
    return "facets/diamondLoupeFacet";
  }

  function __deploy(address deployer) public override returns (address) {
    vm.startBroadcast(deployer);
    DiamondLoupeFacet facet = new DiamondLoupeFacet();
    vm.stopBroadcast();
    return address(facet);
  }
}
