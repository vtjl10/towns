// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces
import {IDiamond} from "@towns-protocol/diamond/src/IDiamond.sol";

//libraries
import "forge-std/console.sol";

//contracts
import {FacetHelper} from "@towns-protocol/diamond/scripts/common/helpers/FacetHelper.s.sol";
import {Deployer} from "scripts/common/Deployer.s.sol";
import {DropFacet} from "src/airdrop/drop/DropFacet.sol";

contract DeployDropFacet is Deployer, FacetHelper {
    // FacetHelper
    constructor() {
        addSelector(DropFacet.claimWithPenalty.selector);
        addSelector(DropFacet.claimAndStake.selector);
        addSelector(DropFacet.setClaimConditions.selector);
        addSelector(DropFacet.addClaimCondition.selector);
        addSelector(DropFacet.getActiveClaimConditionId.selector);
        addSelector(DropFacet.getClaimConditionById.selector);
        addSelector(DropFacet.getSupplyClaimedByWallet.selector);
        addSelector(DropFacet.getDepositIdByWallet.selector);
        addSelector(DropFacet.getClaimConditions.selector);
    }

    // Deploying
    function versionName() public pure override returns (string memory) {
        return "facets/dropFacet";
    }

    function initializer() public pure override returns (bytes4) {
        return DropFacet.__DropFacet_init.selector;
    }

    function makeInitData(address stakingContract) public pure returns (bytes memory) {
        return abi.encodeWithSelector(initializer(), stakingContract);
    }

    function facetInitHelper(
        address deployer,
        address facetAddress
    ) external override returns (FacetCut memory, bytes memory) {
        IDiamond.FacetCut memory facetCut = this.makeCut(facetAddress, IDiamond.FacetCutAction.Add);
        console.log("facetInitHelper: deployer", deployer);
        return (facetCut, makeInitData(getDeployment("baseRegistry")));
    }

    function __deploy(address deployer) internal override returns (address) {
        vm.startBroadcast(deployer);
        DropFacet dropFacet = new DropFacet();
        vm.stopBroadcast();
        return address(dropFacet);
    }
}
