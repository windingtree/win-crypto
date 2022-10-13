import { MockERC20Dec18Permit, MockWrappedERC20Dec18, AssetUpgradeable, LedgerUpgradeable, WinPayUpgradeable } from '../../typechain';
import { ethers, getNamedAccounts, deployments } from 'hardhat';
import { setupUsers } from './';

export type AccountWithContract = { address: string } & {
  erc20: MockERC20Dec18Permit;
  wrappedErc20: MockWrappedERC20Dec18;
  ledger: LedgerUpgradeable;
  asset: AssetUpgradeable;
  wrappedAsset: AssetUpgradeable;
  winPay: WinPayUpgradeable;
};

export const setup = deployments.createFixture(async () => {
  await deployments.fixture('WinPay');
  const contracts = {
    erc20: await ethers.getContract<MockERC20Dec18Permit>('MockERC20Dec18Permit'),
    wrappedErc20: await ethers.getContract<MockWrappedERC20Dec18>('MockWrappedERC20Dec18'),
    ledger: await ethers.getContract<LedgerUpgradeable>('Ledger'),
    asset: await ethers.getContract<AssetUpgradeable>('Asset'),
    wrappedAsset: await ethers.getContract<AssetUpgradeable>('WrappedAsset'),
    winPay: await ethers.getContract<WinPayUpgradeable>('WinPay')
  };
  const users = await setupUsers(await getNamedAccounts(), contracts);
  return {
    ...users,
    ...contracts
  };
});
