// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries
import "forge-std/console.sol";

//contracts
import {FacetHelper} from "@towns-protocol/diamond/scripts/common/helpers/FacetHelper.s.sol";
import {IDiamond} from "@towns-protocol/diamond/src/Diamond.sol";
import {Deployer} from "scripts/common/Deployer.s.sol";
import {NodeRegistry} from "src/river/registry/facets/node/NodeRegistry.sol";

contract DeployNodeRegistry is FacetHelper, Deployer {
    constructor() {
        addSelector(NodeRegistry.isNode.selector);
        addSelector(NodeRegistry.registerNode.selector);
        addSelector(NodeRegistry.removeNode.selector);
        addSelector(NodeRegistry.updateNodeStatus.selector);
        addSelector(NodeRegistry.updateNodeUrl.selector);
        addSelector(NodeRegistry.getNode.selector);
        addSelector(NodeRegistry.getNodeCount.selector);
        addSelector(NodeRegistry.getAllNodeAddresses.selector);
        addSelector(NodeRegistry.getAllNodes.selector);
    }

    function versionName() public pure override returns (string memory) {
        return "facets/nodeRegistryFacet";
    }

    function facetInitHelper(
        address deployer,
        address facetAddress
    ) external override returns (FacetCut memory, bytes memory) {
        IDiamond.FacetCut memory facetCut = this.makeCut(facetAddress, IDiamond.FacetCutAction.Add);
        console.log("facetInitHelper: deployer", deployer);
        return (facetCut, "");
    }

    function __deploy(address deployer) internal override returns (address) {
        vm.startBroadcast(deployer);
        NodeRegistry facet = new NodeRegistry();
        vm.stopBroadcast();
        return address(facet);
    }
}
