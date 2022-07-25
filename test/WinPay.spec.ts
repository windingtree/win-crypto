import { expect } from './chai-setup';
import { utils, constants, Wallet, BigNumber } from 'ethers';
import { setup, AccountWithContract } from './utils/fixture';
import { createPermitSignature } from '../src';
import { escapeError } from './utils/errors';

describe('WinPay', function () {
  let alice: AccountWithContract;
  let deployer: AccountWithContract;
  let bob: AccountWithContract;
  const providerId = utils.keccak256(utils.formatBytes32String('test_provider'));
  const serviceId = utils.keccak256(utils.formatBytes32String('test_service'));
  const value = utils.parseEther('1');

  beforeEach('load fixture', async () => {
    ({ deployer, alice, bob } = await setup());
  });

  context('Manageable behaviour', () => {
    it('#toggle should change live status', async () => {
      expect(await deployer.winPay.live()).to.be.eq(1);
      await expect(deployer.winPay.toggle()).to.emit(deployer.winPay, 'Live').withArgs(0);
      expect(await deployer.winPay.live()).to.be.eq(0);
      await deployer.winPay.toggle();
      expect(await deployer.winPay.live()).to.be.eq(1);
    });

    it('#rely should add party to the auth list', async () => {
      expect(await deployer.winPay.auth(bob.address)).to.be.eq(0);
      await expect(deployer.winPay.rely(bob.address)).to.emit(deployer.winPay, 'Rely').withArgs(bob.address);
      expect(await deployer.winPay.auth(bob.address)).to.be.eq(1);
    });

    it('#deny should remove party from the auth list', async () => {
      await deployer.winPay.rely(bob.address);
      expect(await deployer.winPay.auth(bob.address)).to.be.eq(1);
      await expect(deployer.winPay.deny(bob.address)).to.emit(deployer.winPay, 'Deny').withArgs(bob.address);
      expect(await deployer.winPay.auth(bob.address)).to.be.eq(0);
    });
  });

  context('#register', () => {
    it('should throw if not live', async () => {
      await deployer.winPay.toggle();
      await expect(alice.winPay.register(providerId, alice.address)).to.be.revertedWith('NotLive()');
    });

    it('should register new provider', async () => {
      await expect(alice.winPay.register(providerId, alice.address))
        .to.emit(alice.winPay, 'Provider')
        .withArgs(providerId, alice.address);
      expect(await alice.winPay.providers(providerId)).to.eq(alice.address);
    });

    it('should throw if provider exists', async () => {
      await alice.winPay.register(providerId, alice.address);
      await expect(alice.winPay.register(providerId, alice.address)).to.be.revertedWith('ProviderExists()');
    });
  });

  context('#updateProvider', () => {
    it('should throw if not live', async () => {
      await deployer.winPay.toggle();
      await expect(alice.winPay.updateProvider(providerId, bob.address)).to.be.revertedWith('NotLive()');
    });

    it('should throw called not by an owner', async () => {
      await alice.winPay.register(providerId, alice.address);
      await expect(bob.winPay.updateProvider(providerId, bob.address)).to.be.revertedWith('NotAuthorized()');
    });

    it('should update provider', async () => {
      await alice.winPay.register(providerId, alice.address);
      await expect(alice.winPay.updateProvider(providerId, bob.address))
        .to.emit(alice.winPay, 'Provider')
        .withArgs(providerId, bob.address);
      expect(await bob.winPay.providers(providerId)).to.eq(bob.address);
    });
  });

  context('#deal(bytes32,bytes32,uint256,address,uint256)', () => {
    beforeEach(async () => {
      await alice.winPay.register(providerId, alice.address);
    });

    it('should throw if not live', async () => {
      await deployer.winPay.toggle();
      await expect(
        alice.winPay['deal(bytes32,bytes32,uint256,address,uint256)'](
          providerId,
          serviceId,
          0,
          constants.AddressZero,
          0
        )
      ).to.be.revertedWith('NotLive()');
    });

    it('should throw if asset not allowed', async () => {
      await expect(
        alice.winPay['deal(bytes32,bytes32,uint256,address,uint256)'](
          providerId,
          serviceId,
          Math.ceil(Date.now() / 1000) + 5000,
          alice.asset.address,
          value
        )
      ).to.be.revertedWith('ERC20: insufficient allowance');
    });

    it('should throw if provider not found', async () => {
      await expect(
        alice.winPay['deal(bytes32,bytes32,uint256,address,uint256)'](
          constants.HashZero,
          serviceId,
          Math.ceil(Date.now() / 1000) + 5000,
          alice.asset.address,
          value
        )
      ).to.be.revertedWith(escapeError(`ProviderNotFound("${constants.HashZero}")`));
    });

    it('should register a deal', async () => {
      expect(await alice.ledger.balances(alice.address, alice.erc20.address)).to.eq(0);
      expect(await alice.erc20.balanceOf(alice.asset.address)).to.eq(0);
      const balanceBefore = await alice.erc20.balanceOf(alice.address);
      await alice.erc20.approve(alice.asset.address, value);
      await expect(
        alice.winPay['deal(bytes32,bytes32,uint256,address,uint256)'](
          providerId,
          serviceId,
          Math.ceil(Date.now() / 1000) + 5000,
          alice.asset.address,
          value
        )
      )
        .to.emit(alice.winPay, 'Deal')
        .withArgs(providerId, serviceId);
      expect(await alice.ledger.balances(alice.address, alice.erc20.address)).to.eq(value);
      expect(await alice.erc20.balanceOf(alice.asset.address)).to.eq(value);
      expect(await alice.erc20.balanceOf(alice.address)).to.eq(balanceBefore.sub(value));
    });

    it('should register a deal using wrapped asset', async () => {
      const balanceBefore = await alice.erc20.provider.getBalance(alice.address);
      const tx = alice.winPay['deal(bytes32,bytes32,uint256,address,uint256)'](
        providerId,
        serviceId,
        Math.ceil(Date.now() / 1000) + 5000,
        alice.wrappedAsset.address,
        value,
        {
          value
        }
      );
      await expect(tx).to.emit(alice.winPay, 'Deal').withArgs(providerId, serviceId);
      const receipt = await (await tx).wait();
      expect(await alice.erc20.provider.getBalance(alice.address)).to.eq(
        balanceBefore.sub(value).sub(receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice))
      );
    });

    it('should throw if invalid value provided using wrapped asset', async () => {
      await expect(
        alice.winPay['deal(bytes32,bytes32,uint256,address,uint256)'](
          providerId,
          serviceId,
          Math.ceil(Date.now() / 1000) + 5000,
          alice.wrappedAsset.address,
          value,
          {
            value: value.add(BigNumber.from(1))
          }
        )
      ).to.be.revertedWith('InvalidValue()');
    });

    it('should throw if deals already registered', async () => {
      await alice.erc20.approve(alice.asset.address, value);
      await alice.winPay['deal(bytes32,bytes32,uint256,address,uint256)'](
        providerId,
        serviceId,
        Math.ceil(Date.now() / 1000) + 5000,
        alice.asset.address,
        value
      );
      await expect(
        alice.winPay['deal(bytes32,bytes32,uint256,address,uint256)'](
          providerId,
          serviceId,
          Math.ceil(Date.now() / 1000) + 5000,
          alice.asset.address,
          value
        )
      ).to.be.revertedWith(escapeError(`DealExists("${serviceId}")`));
    });

    it('should throw if deal expired', async () => {
      const expiry = Math.ceil(Date.now() / 1000) - 5000;
      await expect(
        alice.winPay['deal(bytes32,bytes32,uint256,address,uint256)'](
          providerId,
          serviceId,
          expiry,
          alice.asset.address,
          value
        )
      ).to.be.revertedWith(escapeError(`DealExpired("${serviceId}", ${expiry})`));
    });

    it('should throw if balance of tokens not enough', async () => {
      await deployer.erc20.approve(alice.asset.address, value);
      await expect(
        deployer.winPay['deal(bytes32,bytes32,uint256,address,uint256)'](
          providerId,
          serviceId,
          Math.ceil(Date.now() / 1000) + 5000,
          deployer.asset.address,
          value
        )
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });
  });

  context('#deal(bytes32,bytes32,uint256,address,uint256,(address,uint256,uint8,bytes32,bytes32))', () => {
    beforeEach(async () => {
      await alice.winPay.register(providerId, alice.address);
    });

    it('should throw if not live', async () => {
      await deployer.winPay.toggle();
      await expect(
        deployer.winPay['deal(bytes32,bytes32,uint256,address,uint256,(address,uint256,uint8,bytes32,bytes32))'](
          providerId,
          serviceId,
          Math.ceil(Date.now() / 1000) + 5000,
          deployer.erc20.address,
          value,
          {
            owner: deployer.address,
            deadline: 0,
            v: 0,
            r: constants.HashZero,
            s: constants.HashZero
          }
        )
      ).to.be.revertedWith('NotLive()');
    });

    it('should register a deal', async () => {
      expect(await alice.ledger.balances(alice.address, alice.erc20.address)).to.eq(0);
      expect(await alice.erc20.balanceOf(alice.asset.address)).to.eq(0);
      const balanceBefore = await alice.erc20.balanceOf(alice.address);
      const deadline = Math.ceil(Date.now() / 1000) + 5000;
      const { v, r, s } = await createPermitSignature(
        alice.erc20.signer as Wallet,
        alice.erc20,
        alice.address,
        alice.asset.address,
        value,
        deadline
      );
      await expect(
        alice.winPay['deal(bytes32,bytes32,uint256,address,uint256,(address,uint256,uint8,bytes32,bytes32))'](
          providerId,
          serviceId,
          deadline,
          alice.asset.address,
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
        .to.emit(alice.winPay, 'Deal')
        .withArgs(providerId, serviceId);
      expect(await alice.ledger.balances(alice.address, alice.erc20.address)).to.eq(value);
      expect(await alice.erc20.balanceOf(alice.asset.address)).to.eq(value);
      expect(await alice.erc20.balanceOf(alice.address)).to.eq(balanceBefore.sub(value));
    });
  });

  context('#refund(bytes32,address)', () => {
    beforeEach(async () => {
      await alice.winPay.register(providerId, alice.address);
      await bob.erc20.approve(bob.asset.address, value);
      await bob.winPay['deal(bytes32,bytes32,uint256,address,uint256)'](
        providerId,
        serviceId,
        Math.ceil(Date.now() / 1000) + 5000,
        bob.asset.address,
        value
      );
    });

    it('should throw if not live', async () => {
      await deployer.winPay.toggle();
      await expect(alice.winPay.refund(serviceId, alice.asset.address)).to.be.revertedWith('NotLive()');
    });

    it('should make refund', async () => {
      const customerBalanceBefore = await bob.erc20.balanceOf(bob.address);
      const providerBalanceBefore = await alice.ledger.balances(alice.address, alice.erc20.address);
      await expect(alice.winPay.refund(serviceId, alice.asset.address))
        .to.emit(alice.winPay, 'Refund')
        .withArgs(providerId, serviceId);
      expect(await bob.erc20.balanceOf(bob.address)).to.eq(customerBalanceBefore.add(value));
      expect(await alice.ledger.balances(alice.address, alice.erc20.address)).to.eq(providerBalanceBefore.sub(value));
    });

    it('should throw if serviceId does not exist', async () => {
      await expect(alice.winPay.refund(constants.HashZero, alice.asset.address)).to.be.revertedWith(
        escapeError(`DealNotFound("${constants.HashZero}")`)
      );
    });

    it('should throw if called not by the provider', async () => {
      await expect(deployer.winPay.refund(serviceId, alice.asset.address)).to.be.revertedWith('NotAuthorized()');
    });

    it('should throw if the deal already has been refunded', async () => {
      await alice.winPay.refund(serviceId, alice.asset.address);
      await expect(alice.winPay.refund(serviceId, alice.asset.address)).to.be.revertedWith(
        escapeError(`DealAlreadyRefunded("${serviceId}")`)
      );
    });

    it("should throw if provider's balance not enough", async () => {
      await alice.asset.exit(deployer.address, value);
      await expect(alice.winPay.refund(serviceId, alice.asset.address)).to.be.revertedWith('BalanceNotEnough()');
    });
  });
});
