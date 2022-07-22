import { MockERC20, MockWrappedERC20, Asset, Ledger, WinPay } from '../../typechain';
import { ethers, getNamedAccounts, deployments } from 'hardhat';
import { setupUsers } from './';

export type AccountWithContract = { address: string } & {
  erc20: MockERC20;
  wrappedErc20: MockWrappedERC20;
  ledger: Ledger;
  asset: Asset;
  wrappedAsset: Asset;
  winPay: WinPay;
};

export const setup = deployments.createFixture(async () => {
  await deployments.fixture('WinPay');
  const contracts = {
    erc20: await ethers.getContract<MockERC20>('MockERC20'),
    wrappedErc20: await ethers.getContract<MockWrappedERC20>('MockWrappedERC20'),
    ledger: await ethers.getContract<Ledger>('Ledger'),
    asset: await ethers.getContract<Asset>('Asset'),
    wrappedAsset: await ethers.getContract<Asset>('WrappedAsset'),
    winPay: await ethers.getContract<WinPay>('WinPay')
  };
  const users = await setupUsers(await getNamedAccounts(), contracts);
  return {
    ...users,
    ...contracts
  };
});
