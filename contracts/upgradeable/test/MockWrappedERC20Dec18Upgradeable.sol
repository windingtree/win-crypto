// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import './MockERC20Dec18Upgradeable.sol';

/// @custom:security-contact security@windingtree.com
contract MockWrappedERC20Dec18Upgradeable is MockERC20Dec18Upgradeable
{
  event Deposit(address indexed dst, uint256 wad);
  event Withdrawal(address indexed src, uint256 wad);

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

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override whenNotPaused {
    super._beforeTokenTransfer(from, to, amount);
  }
}
