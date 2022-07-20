// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.13;

library Permit {
  struct EIP2612Permit {
    address owner;
    uint256 deadline;
    uint8 v;
    bytes32 r;
    bytes32 s;
  }
}
