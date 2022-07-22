import { expect } from './chai-setup';
import { utils } from 'ethers';
import { setup, AccountWithContract } from './utils/fixture';

describe('MockERC20', function () {
  let alice: AccountWithContract;
  let bob: AccountWithContract;
  let carol: AccountWithContract;

  beforeEach('load fixture', async () => {
    ({ alice, bob, carol } = await setup());
  });

  context('Metadata', async () => {
    it('sets symbol correctly', async () => {
      expect(await alice.erc20.symbol()).to.be.eq('MTK');
      expect(await alice.erc20.name()).to.be.eq('MockERC20');
    });
  });

  context('Allocations', async () => {
    it('gives correct amount to alice', async () => {
      expect(await alice.erc20.balanceOf(alice.address)).to.be.eq(utils.parseEther('1000000'));
    });
    it('gives correct amount to bob', async () => {
      expect(await bob.erc20.balanceOf(alice.address)).to.be.eq(utils.parseEther('1000000'));
    });
    it('gives correct amount to carol', async () => {
      expect(await carol.erc20.balanceOf(alice.address)).to.be.eq(utils.parseEther('1000000'));
    });
  });
});
