import { expect } from './chai-setup';
import { utils, constants } from 'ethers';
import { setup, AccountWithContract } from './utils/fixture';

describe('Ledger', function () {
  let alice: AccountWithContract;
  let deployer: AccountWithContract;
  let bob: AccountWithContract;

  beforeEach('load fixture', async () => {
    ({ deployer, alice, bob } = await setup());
  });

  context('Manageable behaviour', () => {
    it('#toggle should change live status', async () => {
      expect(await deployer.ledger.live()).to.be.eq(1);
      await expect(deployer.ledger.toggle()).to.emit(deployer.ledger, 'Live').withArgs(0);
      expect(await deployer.ledger.live()).to.be.eq(0);
      await deployer.ledger.toggle();
      expect(await deployer.ledger.live()).to.be.eq(1);
    });

    it('#rely should add party to the auth list', async () => {
      expect(await deployer.ledger.auth(bob.address)).to.be.eq(0);
      await expect(deployer.ledger.rely(bob.address)).to.emit(deployer.ledger, 'Rely').withArgs(bob.address);
      expect(await deployer.ledger.auth(bob.address)).to.be.eq(1);
    });

    it('#deny should remove party from the auth list', async () => {
      await deployer.ledger.rely(bob.address);
      expect(await deployer.ledger.auth(bob.address)).to.be.eq(1);
      await expect(deployer.ledger.deny(bob.address)).to.emit(deployer.ledger, 'Deny').withArgs(bob.address);
      expect(await deployer.ledger.auth(bob.address)).to.be.eq(0);
    });
  });

  context('#add', () => {
    it('should throw if not live', async () => {
      await deployer.ledger.toggle();
      await expect(deployer.ledger.add(deployer.address, alice.address, utils.parseEther('1'))).to.be.revertedWith(
        'NotLive()'
      );
    });

    it('should throw if sender not authorized', async () => {
      await expect(alice.ledger.add(alice.address, deployer.address, utils.parseEther('1'))).to.be.revertedWith(
        'NotAuthorized()'
      );
    });

    it('should throw if addition move balance to negative state', async () => {
      await expect(deployer.ledger.add(deployer.address, alice.address, `-${utils.parseEther('1').toString()}`)).to.be
        .reverted;
    });

    it('should throw if addition overflow balance', async () => {
      await deployer.ledger.add(alice.address, constants.AddressZero, constants.MaxInt256);
      await deployer.ledger.add(alice.address, constants.AddressZero, constants.MaxInt256);
      await expect(deployer.ledger.add(alice.address, constants.AddressZero, 2)).to.be.reverted;
    });

    it('should add balance', async () => {
      expect(await deployer.ledger.balances(alice.address, constants.AddressZero)).to.be.eq(0);
      const value = utils.parseEther('1');
      await deployer.ledger.add(alice.address, constants.AddressZero, value);
      expect(await deployer.ledger.balances(alice.address, constants.AddressZero)).to.be.eq(value);
    });
  });

  context('#move', () => {
    it('should throw if not live', async () => {
      await deployer.ledger.toggle();
      await expect(
        deployer.ledger.move(deployer.address, alice.address, constants.AddressZero, utils.parseEther('1'))
      ).to.be.revertedWith('NotLive()');
    });

    it('should throw if sender not authorized', async () => {
      await expect(
        alice.ledger.move(alice.address, deployer.address, constants.AddressZero, utils.parseEther('1'))
      ).to.be.revertedWith('NotAuthorized()');
    });

    it('should move balance', async () => {
      const value = utils.parseEther('1');
      await deployer.ledger.add(alice.address, constants.AddressZero, value);
      expect(await deployer.ledger.balances(alice.address, constants.AddressZero)).to.be.eq(value);
      await deployer.ledger.move(alice.address, deployer.address, constants.AddressZero, value);
      expect(await deployer.ledger.balances(alice.address, constants.AddressZero)).to.be.eq(0);
      expect(await deployer.ledger.balances(deployer.address, constants.AddressZero)).to.be.eq(value);
    });

    it('should throw if trying to move more than exists', async () => {
      expect(await deployer.ledger.balances(alice.address, constants.AddressZero)).to.be.eq(0);
      await expect(deployer.ledger.move(alice.address, deployer.address, constants.AddressZero, 2)).to.be.reverted;
      await deployer.ledger.add(alice.address, constants.AddressZero, 1);
      await expect(deployer.ledger.move(alice.address, deployer.address, constants.AddressZero, 2)).to.be.reverted;
    });
  });
});
