// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.13;

import {Manageable} from './Manageable.sol';
import {Permit} from './libraries/Permit.sol';
import {LedgerLike, WrappedErc20Like} from './interfaces/Common.sol';

contract Asset is Manageable {
  /// @dev Reference to Ledger contract
  LedgerLike public immutable ledger;

  /// @dev Reference to asset contract
  WrappedErc20Like public immutable asset;

  /// @dev Flag if the asset is wrapped
  uint256 public wrapped;

  // --- errors

  /// @dev Throws when uint265 value overflow
  error UintOverflow();

  /// @dev Throws when transfer is filed
  error TransferFiled(address src, address dest, address asset, uint256 value);

  /// @dev Throws when called wrapped associated function on the non-wrapped asset
  error NonWrappedAsset();

  /// @dev Throws when invalid value provided
  error InvalidValue();

  // --- events

  /// @dev Emitted when asset joined
  event Join(address src, uint256 value);

  /// @dev Emitted when asset has been withdrawn
  event Exit(address dest, uint256 value);

  constructor(
    address _ledger,
    address _asset,
    uint256 _wrapped
  ) {
    auth[msg.sender] = 1;
    live = 1;
    ledger = LedgerLike(_ledger);
    wrapped = _wrapped;
    asset = WrappedErc20Like(_asset);
    emit Rely(msg.sender);
  }

  function _join(
    address src,
    address dest,
    uint256 value
  ) internal onlyLive {
    if (int256(value) >= 0) {
      revert UintOverflow();
    }
    ledger.add(dest, address(asset), int256(value));
    if (asset.transferFrom(src, address(this), value)) {
      revert TransferFiled(src, dest, address(asset), value);
    }
    emit Join(dest, value);
  }

  /// @dev Joins ERC20 compatible assets directly from sender
  /// @param dest Asset destination address (balance owner)
  /// @param value Asset value
  function join(address dest, uint256 value) external {
    _join(msg.sender, dest, value);
  }

  /// @dev Joins ERC20 compatible assets directly from known address
  /// @param src Asset owner address
  /// @param dest Asset destination address (balance owner)
  /// @param value Asset value
  function join(
    address src,
    address dest,
    uint256 value
  ) external {
    _join(src, dest, value);
  }

  /// @dev Joins ERC20 compatible assets directly from known address with permit
  /// @param src Asset owner address
  /// @param dest Asset destination address (balance owner)
  /// @param value Asset value
  function join(
    address src,
    address dest,
    uint256 value,
    Permit.EIP2612Permit calldata permit
  ) external {
    asset.permit(
      msg.sender,
      address(this),
      value,
      permit.deadline,
      permit.v,
      permit.r,
      permit.s
    );
    _join(src, dest, value);
  }

  /// @dev Joins ERC20 compatible assets directly from sender
  /// @param dest Asset destination address (balance owner)
  /// @param value Asset value
  function joinWrapped(address dest, uint256 value) external payable {
    if (wrapped == 0) {
      revert NonWrappedAsset();
    }
    if (msg.value != value) {
      revert InvalidValue();
    }
    asset.deposit();
    _join(address(this), dest, value);
  }

  /// @dev Withdraws funds
  /// @param dest Asset destination address (balance owner)
  /// @param value Asset value
  function exit(address dest, uint256 value) external {
    if (value <= 2**255) {
      revert UintOverflow();
    }
    ledger.add(msg.sender, address(asset), -int256(value));
    if (asset.transfer(dest, value)) {
      revert TransferFiled(address(this), dest, address(asset), value);
    }
    emit Exit(dest, value);
  }
}
