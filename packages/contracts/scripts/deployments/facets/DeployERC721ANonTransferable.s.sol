// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces
import {IERC721A} from "src/diamond/facets/token/ERC721A/IERC721A.sol";

//libraries

//contracts
import {FacetHelper} from "@towns-protocol/diamond/scripts/common/helpers/FacetHelper.s.sol";
import {Deployer} from "scripts/common/Deployer.s.sol";
import {ERC721A} from "src/diamond/facets/token/ERC721A/ERC721A.sol";
import {ERC721ANonTransferable} from "src/diamond/facets/token/ERC721A/ERC721ANonTransferable.sol";

contract DeployERC721ANonTransferable is FacetHelper, Deployer {
    constructor() {
        addSelector(IERC721A.totalSupply.selector);
        addSelector(IERC721A.balanceOf.selector);
        addSelector(IERC721A.ownerOf.selector);
        addSelector(IERC721A.transferFrom.selector);
        addSelector(IERC721A.approve.selector);
        addSelector(IERC721A.getApproved.selector);
        addSelector(IERC721A.setApprovalForAll.selector);
        addSelector(IERC721A.isApprovedForAll.selector);
        addSelector(IERC721A.name.selector);
        addSelector(IERC721A.symbol.selector);
        addSelector(IERC721A.tokenURI.selector);
        addSelector(bytes4(keccak256("safeTransferFrom(address,address,uint256)")));
        addSelector(bytes4(keccak256("safeTransferFrom(address,address,uint256,bytes)")));
    }

    function makeInitData(
        string memory name,
        string memory symbol
    ) public pure returns (bytes memory) {
        return abi.encodeWithSelector(ERC721A.__ERC721A_init.selector, name, symbol);
    }

    function versionName() public pure override returns (string memory) {
        return "facets/erc721ANonTransferableFacet";
    }

    function __deploy(address deployer) internal override returns (address) {
        vm.startBroadcast(deployer);
        ERC721ANonTransferable facet = new ERC721ANonTransferable();
        vm.stopBroadcast();
        return address(facet);
    }
}
