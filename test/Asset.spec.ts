import { expect } from './chai-setup';
import { utils, constants, Wallet } from 'ethers';
import { setup, AccountWithContract } from './utils/fixture';
import { createPermitSignature } from '../src';

describe('Asset', function () {
  let alice: AccountWithContract;
  let deployer: AccountWithContract;
  let bob: AccountWithContract;

  beforeEach('load fixture', async () => {
    ({ deployer, alice, bob } = await setup());
  });

  context('Manageable behaviour', () => {
    it('#toggle should change live status', async () => {
      expect(await deployer.asset.live()).to.be.eq(1);
      await expect(deployer.asset.toggle()).to.emit(deployer.asset, 'Live').withArgs(0);
      expect(await deployer.asset.live()).to.be.eq(0);
      await deployer.asset.toggle();
      expect(await deployer.asset.live()).to.be.eq(1);
    });

    it('#rely should add party to the auth list', async () => {
      expect(await deployer.asset.auth(bob.address)).to.be.eq(0);
      await expect(deployer.asset.rely(bob.address)).to.emit(deployer.asset, 'Rely').withArgs(bob.address);
      expect(await deployer.asset.auth(bob.address)).to.be.eq(1);
    });

    it('#deny should remove party from the auth list', async () => {
      await deployer.asset.rely(bob.address);
      expect(await deployer.asset.auth(bob.address)).to.be.eq(1);
      await expect(deployer.asset.deny(bob.address)).to.emit(deployer.asset, 'Deny').withArgs(bob.address);
      expect(await deployer.asset.auth(bob.address)).to.be.eq(0);
    });
  });

  context('#join(address,uint256)', () => {
    it('should throw if not live', async () => {
      await deployer.asset.toggle();
      await expect(deployer.asset['join(address,uint256)'](deployer.address, utils.parseEther('1'))).to.be.revertedWith(
        'NotLive()'
      );
    });
    it('should throw if sender does not allowed tokens', async () => {
      await expect(deployer.asset['join(address,uint256)'](deployer.address, utils.parseEther('1'))).to.be.revertedWith(
        'ERC20: insufficient allowance'
      );
    });
    it('should throw if sender does not have approved amount of tokens', async () => {
      await deployer.erc20.approve(deployer.asset.address, utils.parseEther('1'));
      await expect(deployer.asset['join(address,uint256)'](deployer.address, utils.parseEther('1'))).to.be.revertedWith(
        'ERC20: transfer amount exceeds balance'
      );
    });
    it('should join tokens', async () => {
      const value = utils.parseEther('1');
      await alice.erc20.approve(alice.asset.address, value);
      expect(await alice.ledger.balances(alice.address, alice.erc20.address)).to.be.eq(0);
      await expect(alice.asset['join(address,uint256)'](alice.address, value))
        .to.emit(alice.asset, 'Join')
        .withArgs(alice.address, value);
      expect(await alice.ledger.balances(alice.address, alice.erc20.address)).to.be.eq(value);
    });
  });

  context('#join(address,address,uint256)', () => {
    it('should throw if not live', async () => {
      await deployer.asset.toggle();
      await expect(
        deployer.asset['join(address,address,uint256)'](alice.address, alice.address, utils.parseEther('1'))
      ).to.be.revertedWith('NotLive()');
    });
    it('should throw if src does not allowed tokens', async () => {
      await expect(
        deployer.asset['join(address,address,uint256)'](alice.address, alice.address, utils.parseEther('1'))
      ).to.be.revertedWith('ERC20: insufficient allowance');
    });
    it('should throw if sender does not have approved amount of tokens', async () => {
      await deployer.erc20.approve(deployer.asset.address, utils.parseEther('1'));
      await expect(
        deployer.asset['join(address,address,uint256)'](deployer.address, alice.address, utils.parseEther('1'))
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });
    it('should join tokens', async () => {
      const value = utils.parseEther('1');
      await alice.erc20.approve(alice.asset.address, value);
      expect(await alice.ledger.balances(alice.address, alice.erc20.address)).to.be.eq(0);
      await expect(deployer.asset['join(address,address,uint256)'](alice.address, alice.address, value))
        .to.emit(alice.asset, 'Join')
        .withArgs(alice.address, value);
      expect(await alice.ledger.balances(alice.address, alice.erc20.address)).to.be.eq(value);
    });
  });

  context('#join(address,address,uint256,(address,uint256,uint8,bytes32,bytes32))', () => {
    it('should throw if not live', async () => {
      await deployer.asset.toggle();
      await expect(
        deployer.asset['join(address,address,uint256,(address,uint256,uint8,bytes32,bytes32))'](
          deployer.address,
          alice.address,
          utils.parseEther('1'),
          {
            owner: constants.AddressZero,
            deadline: 0,
            v: 0,
            r: constants.HashZero,
            s: constants.HashZero
          }
        )
      ).to.be.revertedWith('NotLive()');
    });
    it('should join tokens', async () => {
      const value = utils.parseEther('1');
      const deadline = (await alice.erc20.provider.getBlock('latest')).timestamp + 10000;

      const { v, r, s } = await createPermitSignature(
        alice.erc20.signer as Wallet,
        alice.erc20,
        alice.address,
        alice.asset.address,
        value,
        deadline
      );

      await expect(
        deployer.asset['join(address,address,uint256,(address,uint256,uint8,bytes32,bytes32))'](
          alice.address,
          alice.address,
          value,
          {
            owner: alice.address,
            deadline,
            v,
            r,
            s
          }
        )
      )
        .to.emit(alice.asset, 'Join')
        .withArgs(alice.address, value);
    });
  });

  context('#joinWrapped(address,uint256)', () => {
    it('should throw if not live', async () => {
      await deployer.wrappedAsset.toggle();
      await expect(
        deployer.wrappedAsset.joinWrapped(deployer.address, utils.parseEther('1'), {
          value: utils.parseEther('1')
        })
      ).to.be.revertedWith('NotLive()');
    });
  });
});
