// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

import {ITownsPoints} from "src/airdrop/points/ITownsPoints.sol";
import {IImplementationRegistry} from "src/factory/facets/registry/IImplementationRegistry.sol";

// libraries

// contracts
import {MembershipStorage} from "src/spaces/facets/membership/MembershipStorage.sol";

/// @title PointsProxyLib
/// @notice Library for interacting with the TownsPoints contract
library PointsProxyLib {
    /// @dev The implementation ID for the TownsPoints contract
    bytes32 internal constant POINTS_DIAMOND = bytes32("RiverAirdrop");

    // =============================================================
    //                         GETTERS
    // =============================================================

    function airdropDiamond() internal view returns (address) {
        return
            IImplementationRegistry(MembershipStorage.layout().spaceFactory)
                .getLatestImplementation(POINTS_DIAMOND);
    }

    function getPoints(
        ITownsPoints.Action action,
        bytes memory data
    ) internal view returns (uint256) {
        return ITownsPoints(airdropDiamond()).getPoints(action, data);
    }

    function mint(address to, uint256 amount) internal {
        ITownsPoints(airdropDiamond()).mint(to, amount);
    }
}
