// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

//interfaces

//libraries

//contracts
import {FacetHelper} from "@towns-protocol/diamond/scripts/common/helpers/FacetHelper.s.sol";
import {Deployer} from "scripts/common/Deployer.s.sol";
import {ReviewFacet} from "src/spaces/facets/review/ReviewFacet.sol";

contract DeployReviewFacet is Deployer, FacetHelper {
    constructor() {
        addSelector(ReviewFacet.setReview.selector);
        addSelector(ReviewFacet.getReview.selector);
        addSelector(ReviewFacet.getAllReviews.selector);
    }

    function versionName() public pure override returns (string memory) {
        return "facets/reviewFacet";
    }

    function initializer() public pure override returns (bytes4) {
        return ReviewFacet.__Review_init.selector;
    }

    function __deploy(address deployer) internal override returns (address) {
        vm.broadcast(deployer);
        return address(new ReviewFacet());
    }
}
