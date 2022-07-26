// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.13;

import {Ledger} from '../Ledger.sol';
import {Upgradeable} from './Upgradeable.sol';

contract LedgerUpgradeable is Upgradeable, Ledger {
  constructor() Ledger() {}

  function postUpgrade() public onlyUpgrader {
    auth[msg.sender] = 1;
    live = 1;
    emit Rely(msg.sender);
  }

  uint256[50] private __gap;
}
