// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import '@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol';
import './MockERC20Dec18Upgradeable.sol';

/// @custom:security-contact security@windingtree.com
contract MockERC20Dec18PermitUpgradeable is
  MockERC20Dec18Upgradeable,
  ERC20PermitUpgradeable
{
  function initialize(string memory name, string memory symbol) public override initializer {
    super.initialize(name, symbol);
    __ERC20Permit_init(name);
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override(ERC20Upgradeable, MockERC20Dec18Upgradeable) whenNotPaused {
    super._beforeTokenTransfer(from, to, amount);
  }
}
