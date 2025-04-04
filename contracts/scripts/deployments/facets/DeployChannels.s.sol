// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {FacetHelper} from "@towns-protocol/diamond/scripts/common/helpers/FacetHelper.s.sol";
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {Channels} from "contracts/src/spaces/facets/channels/Channels.sol";

contract DeployChannels is FacetHelper, Deployer {
  constructor() {
    addSelector(Channels.createChannel.selector);
    addSelector(Channels.getChannel.selector);
    addSelector(Channels.getChannels.selector);
    addSelector(Channels.updateChannel.selector);
    addSelector(Channels.removeChannel.selector);
    addSelector(Channels.addRoleToChannel.selector);
    addSelector(Channels.getRolesByChannel.selector);
    addSelector(Channels.removeRoleFromChannel.selector);
    addSelector(Channels.createChannelWithOverridePermissions.selector);
  }

  function versionName() public pure override returns (string memory) {
    return "facets/channelsFacet";
  }

  function __deploy(address deployer) public override returns (address) {
    vm.startBroadcast(deployer);
    Channels facet = new Channels();
    vm.stopBroadcast();
    return address(facet);
  }
}
