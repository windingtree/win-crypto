import { ethers, getNamedAccounts, deployments, getUnnamedAccounts } from 'hardhat';

import { setupUser, setupUsers } from './utils';

import { MockWrappedERC20 } from '../typechain';
import { expect } from './chai-setup';
import { utils } from 'ethers';

const setup = deployments.createFixture(async () => {
  await deployments.fixture('MockWrappedERC20');
  const { deployer, alice, bob, carol } = await getNamedAccounts();
  const contracts = {
    erc20: (await ethers.getContract<MockWrappedERC20>('MockWrappedERC20'))
  };
  const users = await setupUsers(await getUnnamedAccounts(), contracts);

  return {
    users,
    deployer: await setupUser(deployer, contracts),
    alice: await setupUser(alice, contracts),
    ...contracts
  };
});

describe('MockWrappedERC20', function () {
  let alice: { address: string } & { erc20: MockWrappedERC20 };

  beforeEach('load fixture', async () => {
    // eslint-disable-next-line @typescript-eslint/no-extra-semi
    ({ alice } = await setup());
  });

  context('Metadata', async () => {
    it('sets symbol correctly', async () => {
      expect(await alice.erc20.symbol()).to.be.eq('WMTK');
      expect(await alice.erc20.name()).to.be.eq('MockWERC20');
    });
  });

  context('Wrapping features', async () => {
    it('should wrap native tokens', async () => {
      expect(await alice.erc20.balanceOf(alice.address)).to.be.eq(0);
      const value = utils.parseEther('1');
      await alice.erc20.deposit({ value });
      expect(await alice.erc20.balanceOf(alice.address)).to.be.eq(value);
    });
    it('should un-wrap tokens', async () => {
      const value = utils.parseEther('1');
      await alice.erc20.deposit({ value });
      expect(await alice.erc20.balanceOf(alice.address)).to.be.eq(value);
      const balanceBefore = await alice.erc20.provider.getBalance(alice.address);
      const tx = await alice.erc20.withdraw(value);
      const receipt = await tx.wait();
      expect(await alice.erc20.balanceOf(alice.address)).to.be.eq(0);
      expect(await alice.erc20.provider.getBalance(alice.address)).to.be.eq(
        balanceBefore
          .add(value)
          .sub(receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice))
      );
    });
  });
});
