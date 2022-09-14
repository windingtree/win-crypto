// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20FlashMint.sol';

contract MockWrappedERC20 is ERC20, ERC20Burnable, Pausable, AccessControl, ERC20Permit, ERC20FlashMint {
  event Deposit(address indexed dst, uint256 wad);
  event Withdrawal(address indexed src, uint256 wad);

  constructor() ERC20('MockWERC20', 'WMTK') ERC20Permit('MockWERC20') {}

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
