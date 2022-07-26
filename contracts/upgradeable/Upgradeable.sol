// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.13;

abstract contract Upgradeable {
  address public upgrader;

  /// @dev Throws when function called not by upgrader
  error NotUpgrader();

  /// @dev Checks is the caller is upgrader
  modifier onlyUpgrader() {
    if (upgrader == address(0)) {
      upgrader = msg.sender;
    }
    if (msg.sender != upgrader) {
      revert NotUpgrader();
    }
    _;
  }

  uint256[50] private __gap;
}
