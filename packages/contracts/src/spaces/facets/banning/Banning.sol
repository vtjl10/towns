// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IBanning} from "src/spaces/facets/banning/IBanning.sol";

// libraries
import {Permissions} from "src/spaces/facets/Permissions.sol";

// contracts

import {BanningBase} from "./BanningBase.sol";
import {Facet} from "@towns-protocol/diamond/src/facets/Facet.sol";
import {ERC721ABase} from "src/diamond/facets/token/ERC721A/ERC721ABase.sol";
import {Entitled} from "src/spaces/facets/Entitled.sol";

contract Banning is IBanning, BanningBase, ERC721ABase, Entitled, Facet {
    function ban(uint256 tokenId) external {
        _validatePermission(Permissions.ModifyBanning);
        if (!_exists(tokenId)) revert Banning__InvalidTokenId(tokenId);
        if (_ownerOf(tokenId) == _owner()) revert Banning__CannotBanOwner();
        if (_ownerOf(tokenId) == msg.sender) revert Banning__CannotBanSelf();
        if (_isBanned(tokenId)) revert Banning__AlreadyBanned(tokenId);
        _ban(tokenId);
    }

    function unban(uint256 tokenId) external {
        if (!_exists(tokenId)) revert Banning__InvalidTokenId(tokenId);
        if (!_isBanned(tokenId)) revert Banning__NotBanned(tokenId);
        _validatePermission(Permissions.ModifyBanning);
        _unban(tokenId);
    }

    function isBanned(uint256 tokenId) external view returns (bool) {
        return _isBanned(tokenId);
    }

    function banned() external view returns (uint256[] memory) {
        return _bannedTokenIds();
    }
}
