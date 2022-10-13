// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol';
import './MockERC20Dec18.sol';

/// @custom:security-contact security@windingtree.com
contract MockERC20Dec18Permit is MockERC20Dec18, ERC20Permit {
  constructor(string memory name, string memory symbol) MockERC20Dec18(name, symbol) ERC20Permit(name) {}

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override(ERC20, MockERC20Dec18) whenNotPaused {
    super._beforeTokenTransfer(from, to, amount);
  }
}
