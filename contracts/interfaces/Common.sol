// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.13;

import {Permit} from '../libraries/Permit.sol';

interface LedgerLike {
  function balances(address dest, address asset) external returns (uint256);

  function add(
    address,
    address,
    int256
  ) external;

  function move(
    address src,
    address dest,
    address asset,
    uint256 value
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

interface WrappedErc20Like is Erc20Like {
  function deposit() external;

  function withdraw(uint256 wad) external;
}

interface AssetLike {
  function ledger() external returns (address);

  function asset() external returns (address);

  function wrapped() external returns (uint256);

  function join(address dest, uint256 value) external;

  function join(
    address src,
    address dest,
    uint256 value
  ) external;

  function join(
    address src,
    address dest,
    uint256 value,
    Permit.EIP2612Permit memory permit
  ) external;

  function exit(address dest, uint256 value) external;
}
