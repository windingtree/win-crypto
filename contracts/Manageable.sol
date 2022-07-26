// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.13;

abstract contract Manageable {
  /// @dev Active flag
  uint256 public live;

  /// @dev Authorized parties
  mapping(address => uint256) public auth;

  // -- errors

  /// @dev Throws if the contract called when it is not live
  error NotLive();

  /// @dev Throws when action is not authorized
  error NotAuthorized();

  // -- events

  /// @dev Emitted when the contract live flag is changed
  event Live(uint256 live);

  /// @dev Emitted when a party is authorized
  event Rely(address party);

  /// @dev Emitted when a party is denied
  event Deny(address party);

  // --- modifiers

  /// @dev Checks if the sender is authorized
  modifier authorized() {
    if (auth[msg.sender] != 1) {
      revert NotAuthorized();
    }
    _;
  }

  /// @dev Checks is the contract live
  modifier onlyLive() {
    if (live == 0) {
      revert NotLive();
    }
    _;
  }

  // --- admin

  /// @dev Toggles the contract live flag
  function toggle() external authorized {
    if (live == 1) {
      live = 0;
    } else {
      live = 1;
    }
    emit Live(live);
  }

  /// @dev Adds authorized party
  function rely(address party) external authorized {
    auth[party] = 1;
    emit Rely(party);
  }

  /// @dev Removes authorized party
  function deny(address party) external authorized {
    auth[party] = 0;
    emit Deny(party);
  }

  uint256[50] private __gap;
}
