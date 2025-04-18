// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {FacetHelper} from "@towns-protocol/diamond/scripts/common/helpers/FacetHelper.s.sol";
import {IDiamond} from "@towns-protocol/diamond/src/Diamond.sol";
import {Deployer} from "scripts/common/Deployer.s.sol";
import {OperatorRegistry} from "src/river/registry/facets/operator/OperatorRegistry.sol";

contract DeployOperatorRegistry is FacetHelper, Deployer {
    constructor() {
        addSelector(OperatorRegistry.approveOperator.selector);
        addSelector(OperatorRegistry.isOperator.selector);
        addSelector(OperatorRegistry.removeOperator.selector);
        addSelector(OperatorRegistry.getAllOperators.selector);
    }

    function initializer() public pure override returns (bytes4) {
        return OperatorRegistry.__OperatorRegistry_init.selector;
    }

    function makeInitData(address[] memory operators) public pure returns (bytes memory) {
        return abi.encodeWithSelector(initializer(), operators);
    }

    function versionName() public pure override returns (string memory) {
        return "facets/operatorRegistryFacet";
    }

    function facetInitHelper(
        address deployer,
        address facetAddress
    ) external override returns (FacetCut memory, bytes memory) {
        IDiamond.FacetCut memory facetCut = this.makeCut(facetAddress, IDiamond.FacetCutAction.Add);
        address[] memory operators = new address[](1);
        operators[0] = deployer;
        return (facetCut, makeInitData(operators));
    }

    function __deploy(address deployer) internal override returns (address) {
        vm.startBroadcast(deployer);
        OperatorRegistry facet = new OperatorRegistry();
        vm.stopBroadcast();
        return address(facet);
    }
}
