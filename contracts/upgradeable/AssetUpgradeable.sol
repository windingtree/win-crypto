// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import {LedgerLike, WrappedErc20Like} from '../interfaces/Common.sol';
import {ExitSelfable} from '../ExitSelfable.sol';
import {AssetUpgradeableV2} from './AssetUpgradeableV2.sol';

contract AssetUpgradeable is AssetUpgradeableV2 {
  /// @dev Throws when invalid `what` provided
  error InvalidWhat();

  constructor(
    address _ledger,
    address _asset,
    uint256 _wrapped
  ) AssetUpgradeableV2(_ledger, _asset, _wrapped) {}

  /// @dev Allows to set the contract props
  /// @param what The contract prop
  /// @param data The prop value
  function set(bytes32 what, address data) external authorized {
    if (what == 'ledger') {
      ledger = LedgerLike(data);
    } else if (what == 'asset') {
      asset = WrappedErc20Like(data);
    } else {
      revert InvalidWhat();
    }
  }

  /// @dev Allows to set the contract props
  /// @param what The contract prop
  /// @param data The prop value
  function set(bytes32 what, uint256 data) external authorized {
    if (what == 'wrapped') {
      wrapped = data;
    } else {
      revert InvalidWhat();
    }
  }

  uint256[50] private __gap;
}
