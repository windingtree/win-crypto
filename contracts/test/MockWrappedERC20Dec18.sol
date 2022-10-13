// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import './MockERC20Dec18.sol';

contract MockWrappedERC20Dec18 is MockERC20Dec18 {
  event Deposit(address indexed dst, uint256 wad);
  event Withdrawal(address indexed src, uint256 wad);

  constructor(string memory name, string memory symbol) MockERC20Dec18(name, symbol) {}

  receive() external payable {
    deposit();
  }

  function deposit() public payable {
    _mint(msg.sender, msg.value);
    emit Deposit(msg.sender, msg.value);
  }

  function withdraw(uint256 wad) public payable {
    require(balanceOf(msg.sender) >= wad);
    _burn(msg.sender, wad);
    address payable sender = payable(msg.sender);
    sender.transfer(wad);
    emit Withdrawal(msg.sender, wad);
  }
}
