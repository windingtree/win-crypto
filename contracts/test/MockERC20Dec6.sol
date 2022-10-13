// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import './MockERC20Dec18.sol';

/// @custom:security-contact security@windingtree.com
contract MockERC20Dec6 is MockERC20Dec18 {

  constructor(string memory name, string memory symbol) MockERC20Dec18(name, symbol) {}

  function decimals() public pure override(ERC20) returns (uint8) {
    return 6;
  }
}
