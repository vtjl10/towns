// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// helpers
import {FacetHelper} from "@towns-protocol/diamond/scripts/common/helpers/FacetHelper.s.sol";
import {Deployer} from "scripts/common/Deployer.s.sol";
import {RewardsDistribution} from "src/base/registry/facets/distribution/v2/RewardsDistribution.sol";

contract DeployRewardsDistributionV2 is Deployer, FacetHelper {
    constructor() {
        addSelector(RewardsDistribution.upgradeDelegationProxy.selector);
        addSelector(RewardsDistribution.setRewardNotifier.selector);
        addSelector(RewardsDistribution.setPeriodRewardAmount.selector);
        addSelector(RewardsDistribution.stake.selector);
        addSelector(RewardsDistribution.permitAndStake.selector);
        addSelector(RewardsDistribution.stakeOnBehalf.selector);
        addSelector(RewardsDistribution.increaseStake.selector);
        addSelector(RewardsDistribution.permitAndIncreaseStake.selector);
        addSelector(RewardsDistribution.redelegate.selector);
        addSelector(RewardsDistribution.changeBeneficiary.selector);
        addSelector(RewardsDistribution.initiateWithdraw.selector);
        addSelector(RewardsDistribution.withdraw.selector);
        addSelector(RewardsDistribution.claimReward.selector);
        addSelector(RewardsDistribution.notifyRewardAmount.selector);
        addSelector(RewardsDistribution.stakingState.selector);
        addSelector(RewardsDistribution.stakedByDepositor.selector);
        addSelector(RewardsDistribution.getDepositsByDepositor.selector);
        addSelector(RewardsDistribution.treasureByBeneficiary.selector);
        addSelector(RewardsDistribution.depositById.selector);
        addSelector(RewardsDistribution.delegationProxyById.selector);
        addSelector(RewardsDistribution.isRewardNotifier.selector);
        addSelector(RewardsDistribution.lastTimeRewardDistributed.selector);
        addSelector(RewardsDistribution.currentRewardPerTokenAccumulated.selector);
        addSelector(RewardsDistribution.currentReward.selector);
        addSelector(RewardsDistribution.currentSpaceDelegationReward.selector);
        addSelector(RewardsDistribution.implementation.selector);
        addSelector(RewardsDistribution.getPeriodRewardAmount.selector);
    }

    function initializer() public pure override returns (bytes4) {
        return RewardsDistribution.__RewardsDistribution_init.selector;
    }

    function makeInitData(
        address stakeToken,
        address rewardToken,
        uint256 rewardDuration
    ) public pure returns (bytes memory) {
        return abi.encodeWithSelector(initializer(), stakeToken, rewardToken, rewardDuration);
    }

    function versionName() public pure override returns (string memory) {
        return "facets/rewardsDistributionV2Facet";
    }

    function __deploy(address deployer) internal override returns (address) {
        vm.broadcast(deployer);
        return address(new RewardsDistribution());
    }
}
