// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import '@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol';
import './MockERC20Dec18PermitUpgradeable.sol';

/// @custom:security-contact security@windingtree.com
contract MockERC20Dec6PermitUpgradeable is MockERC20Dec18PermitUpgradeable {
  function decimals() public pure override returns (uint8) {
    return 6;
  }
}
