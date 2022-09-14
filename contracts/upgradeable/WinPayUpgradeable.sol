// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import {WinPay} from '../WinPay.sol';
import {Upgradeable} from './Upgradeable.sol';
import {LedgerLike} from '../interfaces/Common.sol';

contract WinPayUpgradeable is Upgradeable, WinPay {
  constructor(address _ledger) WinPay(_ledger) {}

  function postUpgrade(address _ledger) public onlyUpgrader {
    auth[msg.sender] = 1;
    live = 1;
    ledger = LedgerLike(_ledger);
    emit Rely(msg.sender);
  }

  uint256[50] private __gap;
}
