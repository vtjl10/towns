// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

import {IImplementationRegistry} from "./../../src/factory/facets/registry/IImplementationRegistry.sol";

import {SpaceDelegationFacet} from "src/base/registry/facets/delegation/SpaceDelegationFacet.sol";
import {IMainnetDelegation} from "src/base/registry/facets/mainnet/IMainnetDelegation.sol";
import {ISpaceOwner} from "src/spaces/facets/owner/ISpaceOwner.sol";

// libraries

// contracts

import {MAX_CLAIMABLE_SUPPLY} from "./InteractClaimCondition.s.sol";
import {Interaction} from "scripts/common/Interaction.s.sol";
import {MockTowns} from "test/mocks/MockTowns.sol";

// deployments

import {DeployBaseRegistry} from "scripts/deployments/diamonds/DeployBaseRegistry.s.sol";

import {DeployRiverAirdrop} from "scripts/deployments/diamonds/DeployRiverAirdrop.s.sol";
import {DeploySpaceFactory} from "scripts/deployments/diamonds/DeploySpaceFactory.s.sol";
import {DeploySpaceOwner} from "scripts/deployments/diamonds/DeploySpaceOwner.s.sol";

import {DeployProxyBatchDelegation} from "scripts/deployments/utils/DeployProxyBatchDelegation.s.sol";
import {DeployTownsBase} from "scripts/deployments/utils/DeployTownsBase.s.sol";

contract InteractPostDeploy is Interaction {
    function __interact(address deployer) internal override {
        vm.pauseGasMetering();

        DeploySpaceOwner deploySpaceOwner = new DeploySpaceOwner();
        DeploySpaceFactory deploySpaceFactory = new DeploySpaceFactory();
        DeployBaseRegistry deployBaseRegistry = new DeployBaseRegistry();
        DeployTownsBase deployTownsBase = new DeployTownsBase();
        DeployProxyBatchDelegation deployProxyDelegation = new DeployProxyBatchDelegation();
        DeployRiverAirdrop deployRiverAirdrop = new DeployRiverAirdrop();

        address spaceOwner = deploySpaceOwner.deploy(deployer);
        address spaceFactory = deploySpaceFactory.deploy(deployer);
        address baseRegistry = deployBaseRegistry.deploy(deployer);
        address townsBase = deployTownsBase.deploy(deployer);
        address mainnetProxyDelegation = deployProxyDelegation.deploy(deployer);
        address riverAirdrop = deployRiverAirdrop.deploy(deployer);

        // this is for anvil deployment only
        vm.startBroadcast(deployer);
        // this is for anvil deployment only
        MockTowns(townsBase).localMint(riverAirdrop, MAX_CLAIMABLE_SUPPLY);
        ISpaceOwner(spaceOwner).setFactory(spaceFactory);
        IImplementationRegistry(spaceFactory).addImplementation(baseRegistry);
        IImplementationRegistry(spaceFactory).addImplementation(riverAirdrop);
        SpaceDelegationFacet(baseRegistry).setRiverToken(townsBase);
        IMainnetDelegation(baseRegistry).setProxyDelegation(mainnetProxyDelegation);
        vm.stopBroadcast();
    }
}
