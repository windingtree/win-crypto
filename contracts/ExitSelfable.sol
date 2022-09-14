// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import {Asset} from './Asset.sol';

abstract contract ExitSelfable is Asset {

  /// @dev Withdraws self owned funds
  /// @param dst Asset destination address (balance owner)
  function exitSelf(address dst) external authorized {
    uint256 selfBalance = asset.balanceOf(address(this));
    if (!asset.transfer(dst, selfBalance)) {
      revert TransferFailed(address(this), dst, address(asset), selfBalance);
    }
  }

  uint256[50] private __gap;
}
