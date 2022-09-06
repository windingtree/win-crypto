import type { ProxyOptions } from 'hardhat-deploy/dist/types';
import type { AssetUpgradeable } from '../typechain';
import { expect } from './chai-setup';
import { utils } from 'ethers';
import { setup, AccountWithContract } from './utils/fixture';
import { ethers, deployments } from 'hardhat';

describe('AssetUpgradeable', () => {
  let alice: AccountWithContract;
  let deployer: AccountWithContract;
  const value = utils.parseEther('1');

  beforeEach('load fixture', async () => {
    ({ deployer, alice } = await setup());

    // Join funds
    const balanceBefore = await alice.erc20.balanceOf(alice.asset.address);
    await alice.erc20.approve(alice.asset.address, value);
    expect(await alice.ledger.balances(alice.address, alice.erc20.address)).to.be.eq(0);
    await expect(alice.asset['join(address,uint256)'](alice.address, value))
      .to.emit(alice.asset, 'Join')
      .withArgs(alice.address, value);
    expect(await alice.ledger.balances(alice.address, alice.erc20.address)).to.be.eq(value);
    expect(await alice.erc20.balanceOf(alice.asset.address)).to.eq(balanceBefore.add(value));

    // Exit funds to  Asset contract itself
    await expect(alice.asset.exit(alice.asset.address, value)).to.emit(alice.asset, 'Exit').withArgs(alice.asset.address, value);
    expect(await alice.ledger.balances(alice.address, alice.erc20.address)).to.be.eq(0);
    expect(await alice.erc20.balanceOf(alice.asset.address)).to.eq(value);

    // Upgrade V1 -> V2
    const { deploy } = deployments;

    const PROXY_SETTINGS_WITH_UPGRADE: ProxyOptions = {
      owner: deployer.address,
      proxyContract: 'OpenZeppelinTransparentProxy'
    };

    const assetErc20Deploy = await deploy('Asset', {
      contract: 'AssetUpgradeable',
      proxy: PROXY_SETTINGS_WITH_UPGRADE,
      from: deployer.address,
      log: true,
      autoMine: true,
      args: [deployer.ledger.address, deployer.erc20.address, 0]
    });

    if (assetErc20Deploy.newlyDeployed) {
      console.log(
        `Contract Asset (erc20) upgraded at ${assetErc20Deploy.address} using ${assetErc20Deploy.receipt?.gasUsed} gas`
      );
    }

    // Update setup
    const upgradedAsset = await ethers.getContract<AssetUpgradeable>('Asset');
    alice.asset = upgradedAsset.connect(await ethers.getSigner(alice.address));
    deployer.asset = upgradedAsset.connect(await ethers.getSigner(deployer.address));
  });

  context('ExitSelfable behaviour', () => {
    it('should throw if called not by an deployer', async () => {
      await expect((alice.asset as AssetUpgradeable).exitSelf(alice.address)).to.be.revertedWith('NotAuthorized()');
    });

    it('should exit self funds', async () => {
      const assetBalance = await alice.erc20.balanceOf(deployer.asset.address);
      const aliceBalanceBefore = await alice.erc20.balanceOf(alice.address);
      await (deployer.asset as AssetUpgradeable).exitSelf(alice.address);
      expect(await alice.erc20.balanceOf(deployer.asset.address)).to.be.eq(0);
      expect(await alice.erc20.balanceOf(alice.address)).to.be.eq(
        aliceBalanceBefore.add(assetBalance)
      );
    });
  });
});
