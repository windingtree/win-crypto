// SPDX-License-Identifier: GNU GPLv3
pragma solidity ^0.8.13;

import {Manageable} from './Manageable.sol';

contract Ledger is Manageable {
  /// @dev Balances
  mapping(address => mapping(address => uint256)) public balances; // EOA => asset address => balance

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
  ) external onlyLive authorized {
    balances[dest][asset] = _add(balances[dest][asset], value);
  }

  /// @dev Move balance from the source to destination
  /// @param src Balance owner address
  /// @param dest Destination address
  /// @param asset Asset contract address
  /// @param value Asset value
  function move(
    address src,
    address dest,
    address asset,
    uint256 value
  ) external onlyLive authorized {
    balances[src][asset] = _add(balances[src][asset], -int256(value));
    balances[dest][asset] = _add(balances[dest][asset], int256(value));
  }

  // --- helpers
  function _add(uint256 x, int256 y) internal pure returns (uint256 z) {
    unchecked {
      z = x + uint256(y);
      require(y >= 0 || z <= x);
      require(y <= 0 || z >= x);
    }
  }

  uint256[50] private __gap;
}
