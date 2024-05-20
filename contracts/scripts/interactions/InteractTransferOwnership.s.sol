// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.23;

// interfaces
import {IERC173} from "contracts/src/diamond/facets/ownable/IERC173.sol";

// libraries

// contracts
import {Interaction} from "../common/Interaction.s.sol";

contract InteractTransferOwnership is Interaction {
  function __interact(uint256 pk, address) public override {
    address registry = getDeployment("riverRegistry");
    address newOwner = 0x63217D4c321CC02Ed306cB3843309184D347667B;

    vm.startBroadcast(pk);
    IERC173(registry).transferOwnership(newOwner);
    vm.stopBroadcast();
  }
}
