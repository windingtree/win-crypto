// SPDX-License-Identifier: GNU GPLv3
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
