// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.13;

import {Manageable} from './Manageable.sol';

contract Ledger is Manageable {
  /// @dev Balances
  mapping(address => mapping(address => uint256)) public balances;

  constructor() {
    auth[msg.sender] = 1;
    live = 1;
    emit Rely(msg.sender);
  }

  /// @dev Adds or subtract value of the asset
  /// @param dest Balance owner address
  /// @param asset Asset contract address
  /// @param value Asset value
  function add(
    address dest,
    address asset,
    int256 value
  ) external authorized {
    balances[dest][asset] = _add(balances[dest][asset], value);
  }

  // --- helpers
  function _add(uint256 x, int256 y) internal pure returns (uint256 z) {
    unchecked {
      z = x + uint256(y);
      require(y >= 0 || z <= x);
      require(y <= 0 || z >= x);
    }
  }
}
