import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  WinPay,
  WinPayUpgradeable,
  Ledger,
  LedgerUpgradeable,
  Asset,
  AssetUpgradeable,
  WinPayUpgradeable__factory,
  LedgerUpgradeable__factory,
  AssetUpgradeable__factory
} from '../typechain';

export const getWinPayContract = async (
  hre: HardhatRuntimeEnvironment,
  winPayAddress: string,
  signerAddress: string
): Promise<WinPay | WinPayUpgradeable> => {
  const signer = await hre.ethers.getSigner(signerAddress);
  return WinPayUpgradeable__factory
    .connect(winPayAddress, signer);
}

export const getLedgerContract = async (
  hre: HardhatRuntimeEnvironment,
  ledgerAddress: string,
  signerAddress: string
): Promise<Ledger | LedgerUpgradeable> => {
  const signer = await hre.ethers.getSigner(signerAddress);
  return LedgerUpgradeable__factory
    .connect(ledgerAddress, signer);
}

export const getAssetContract = async (
  hre: HardhatRuntimeEnvironment,
  assetAddress: string,
  signerAddress: string
): Promise<Asset | AssetUpgradeable> => {
  const signer = await hre.ethers.getSigner(signerAddress);
  return AssetUpgradeable__factory
    .connect(assetAddress, signer);
}
