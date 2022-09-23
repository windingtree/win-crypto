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

    const { deploy } = deployments;

    const PROXY_SETTINGS_WITH_UPGRADE: ProxyOptions = {
      owner: deployer.address,
      proxyContract: 'OpenZeppelinTransparentProxy'
    };



    // Update setup
    const upgradedAsset = await ethers.getContract<AssetUpgradeable>('Asset');
    alice.asset = upgradedAsset.connect(await ethers.getSigner(alice.address));
    deployer.asset = upgradedAsset.connect(await ethers.getSigner(deployer.address));
  });


});
