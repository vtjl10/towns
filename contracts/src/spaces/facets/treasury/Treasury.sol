// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IMembershipBase} from "contracts/src/spaces/facets/membership/IMembership.sol";
import {ITreasury} from "contracts/src/spaces/facets/treasury/ITreasury.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

// libraries
import {CurrencyTransfer} from "contracts/src/utils/libraries/CurrencyTransfer.sol";

// contracts
import {TokenOwnableBase} from "@towns-protocol/diamond/src/facets/ownable/token/TokenOwnableBase.sol";
import {ReentrancyGuard} from "solady/utils/ReentrancyGuard.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";
import {MembershipStorage} from "contracts/src/spaces/facets/membership/MembershipStorage.sol";
import {Facet} from "@towns-protocol/diamond/src/facets/Facet.sol";

contract Treasury is TokenOwnableBase, ReentrancyGuard, Facet, ITreasury {
  function __Treasury_init() external onlyInitializing {
    _addInterface(type(IERC1155Receiver).interfaceId);
  }

  ///@inheritdoc ITreasury
  function withdraw(address account) external onlyOwner nonReentrant {
    if (account == address(0))
      CustomRevert.revertWith(
        IMembershipBase.Membership__InvalidAddress.selector
      );

    // get the balance
    uint256 balance = address(this).balance;

    // verify the balance is not 0
    if (balance == 0)
      CustomRevert.revertWith(
        IMembershipBase.Membership__InsufficientPayment.selector
      );

    address currency = MembershipStorage.layout().membershipCurrency;

    CurrencyTransfer.transferCurrency(
      currency,
      address(this),
      account,
      balance
    );

    emit IMembershipBase.MembershipWithdrawal(account, balance);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           Hooks                            */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  ///@inheritdoc ITreasury
  function onERC721Received(
    address,
    address,
    uint256,
    bytes memory
  ) external pure returns (bytes4) {
    return this.onERC721Received.selector;
  }

  ///@inheritdoc ITreasury
  function onERC1155Received(
    address,
    address,
    uint256,
    uint256,
    bytes memory
  ) external pure returns (bytes4) {
    return this.onERC1155Received.selector;
  }

  ///@inheritdoc ITreasury
  function onERC1155BatchReceived(
    address,
    address,
    uint256[] memory,
    uint256[] memory,
    bytes memory
  ) external pure returns (bytes4) {
    return this.onERC1155BatchReceived.selector;
  }
}
