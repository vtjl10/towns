// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {FacetHelper} from "@towns-protocol/diamond/scripts/common/helpers/FacetHelper.s.sol";
import {IDiamond} from "@towns-protocol/diamond/src/Diamond.sol";
import {Deployer} from "scripts/common/Deployer.s.sol";
import {RiverConfig} from "src/river/registry/facets/config/RiverConfig.sol";

contract DeployRiverConfig is FacetHelper, Deployer {
    constructor() {
        addSelector(RiverConfig.configurationExists.selector);
        addSelector(RiverConfig.setConfiguration.selector);
        addSelector(RiverConfig.deleteConfiguration.selector);
        addSelector(RiverConfig.deleteConfigurationOnBlock.selector);
        addSelector(RiverConfig.getConfiguration.selector);
        addSelector(RiverConfig.getAllConfiguration.selector);
        addSelector(RiverConfig.isConfigurationManager.selector);
        addSelector(RiverConfig.approveConfigurationManager.selector);
        addSelector(RiverConfig.removeConfigurationManager.selector);
    }

    function initializer() public pure override returns (bytes4) {
        return RiverConfig.__RiverConfig_init.selector;
    }

    function makeInitData(address[] memory configManagers) public pure returns (bytes memory) {
        return abi.encodeWithSelector(initializer(), configManagers);
    }

    function versionName() public pure override returns (string memory) {
        return "facets/riverConfigFacet";
    }

    function facetInitHelper(
        address deployer,
        address facetAddress
    ) external override returns (FacetCut memory, bytes memory) {
        IDiamond.FacetCut memory facetCut = this.makeCut(facetAddress, IDiamond.FacetCutAction.Add);
        address[] memory configManagers = new address[](1);
        configManagers[0] = deployer;
        return (facetCut, makeInitData(configManagers));
    }

    function __deploy(address deployer) internal override returns (address) {
        vm.startBroadcast(deployer);
        RiverConfig riverConfig = new RiverConfig();
        vm.stopBroadcast();
        return address(riverConfig);
    }
}
