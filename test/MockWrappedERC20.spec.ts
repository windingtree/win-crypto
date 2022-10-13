import { expect } from './chai-setup';
import { utils } from 'ethers';
import { setup, AccountWithContract } from './utils/fixture';

describe('MockWrappedERC20', function () {
  let alice: AccountWithContract;

  beforeEach('load fixture', async () => {
    ({ alice } = await setup());
  });

  context('Metadata', () => {
    it('sets symbol correctly', async () => {
      expect(await alice.wrappedErc20.symbol()).to.be.eq('MockWrappedERC20Dec18');
      expect(await alice.wrappedErc20.name()).to.be.eq('MockWrappedERC20Dec18');
    });
  });

  context('Wrapping features', () => {
    it('should wrap native tokens', async () => {
      expect(await alice.wrappedErc20.balanceOf(alice.address)).to.be.eq(0);
      const value = utils.parseEther('1');
      await alice.wrappedErc20.deposit({ value });
      expect(await alice.wrappedErc20.balanceOf(alice.address)).to.be.eq(value);
    });
    it('should un-wrap tokens', async () => {
      const value = utils.parseEther('1');
      await alice.wrappedErc20.deposit({ value });
      expect(await alice.wrappedErc20.balanceOf(alice.address)).to.be.eq(value);
      const balanceBefore = await alice.wrappedErc20.provider.getBalance(alice.address);
      const tx = await alice.wrappedErc20.withdraw(value);
      const receipt = await tx.wait();
      expect(await alice.wrappedErc20.balanceOf(alice.address)).to.be.eq(0);
      expect(await alice.wrappedErc20.provider.getBalance(alice.address)).to.be.eq(
        balanceBefore.add(value).sub(receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice))
      );
    });
  });
});
