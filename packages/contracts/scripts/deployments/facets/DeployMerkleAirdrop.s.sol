// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

//libraries

//contracts
import {FacetHelper} from "@towns-protocol/diamond/scripts/common/helpers/FacetHelper.s.sol";
import {Deployer} from "scripts/common/Deployer.s.sol";
import {MerkleAirdrop} from "src/utils/airdrop/merkle/MerkleAirdrop.sol";

contract DeployMerkleAirdrop is Deployer, FacetHelper {
    // FacetHelper
    constructor() {
        addSelector(MerkleAirdrop.claim.selector);
        addSelector(MerkleAirdrop.getMerkleRoot.selector);
        addSelector(MerkleAirdrop.getToken.selector);
        addSelector(MerkleAirdrop.getMessageHash.selector);
    }

    // Deploying
    function versionName() public pure override returns (string memory) {
        return "facets/merkleAirdropFacet";
    }

    function initializer() public pure override returns (bytes4) {
        return MerkleAirdrop.__MerkleAirdrop_init.selector;
    }

    function makeInitData(bytes32 merkleRoot, address token) public pure returns (bytes memory) {
        return abi.encodeWithSelector(initializer(), merkleRoot, IERC20(token));
    }

    function __deploy(address deployer) internal override returns (address) {
        vm.startBroadcast(deployer);
        MerkleAirdrop merkleAirdrop = new MerkleAirdrop();
        vm.stopBroadcast();
        return address(merkleAirdrop);
    }
}
