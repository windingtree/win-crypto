import { MockERC20, MockWrappedERC20, AssetUpgradeable, LedgerUpgradeable, WinPayUpgradeable } from '../../typechain';
import { ethers, getNamedAccounts, deployments } from 'hardhat';
import { setupUsers } from './';

export type AccountWithContract = { address: string } & {
  erc20: MockERC20;
  wrappedErc20: MockWrappedERC20;
  ledger: LedgerUpgradeable;
  asset: AssetUpgradeable;
  wrappedAsset: AssetUpgradeable;
  winPay: WinPayUpgradeable;
};

export const setup = deployments.createFixture(async () => {
  await deployments.fixture('WinPay');
  const contracts = {
    erc20: await ethers.getContract<MockERC20>('MockERC20'),
    wrappedErc20: await ethers.getContract<MockWrappedERC20>('MockWrappedERC20'),
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
