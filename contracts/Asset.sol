// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.13;

import {Manageable} from './Manageable.sol';
import {Permit} from './libraries/Permit.sol';

interface LedgerLike {
  function add(
    address,
    address,
    int256
  ) external;
}

interface Erc20Like {
  function decimals() external view returns (uint256);

  function transfer(address, uint256) external returns (bool);

  function transferFrom(
    address,
    address,
    uint256
  ) external returns (bool);

  function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external;
}

contract Asset is Manageable {
  LedgerLike public immutable ledger;
  Erc20Like public immutable asset;
  uint256 public decimals;

  // --- errors

  /// @dev Throws when uint265 value overflow
  error UintOverflow();

  /// @dev Throws when transfer is filed
  error TransferFiled(address src, address dest, address asset, uint256 value);

  // --- events

  /// @dev Emitted when asset joined
  event Join(address src, uint256 value);

  /// @dev Emitted when asset has been withdrawn
  event Exit(address dest, uint256 value);

  constructor(address _win, address _asset) {
    auth[msg.sender] = 1;
    live = 1;
    ledger = LedgerLike(_win);
    asset = Erc20Like(_asset);
    decimals = asset.decimals();
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
