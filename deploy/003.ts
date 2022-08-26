import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { network } from 'hardhat';
import { utils } from 'ethers';

/**
 * Gnosis chain deployments
 */

export interface TokenConfig {
  token: string;
  address: string;
  isWrapped: number;
}

export interface NetworkTokens {
  [network: string]: TokenConfig[]
}

const tokens: NetworkTokens = {
  gnosis: [
    {
      token: 'wxDAI',
      address: '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d',
      isWrapped: 1
    },
    {
      token: 'USDC',
      address: '0xddafbb505ad214d7b80b1f830fccc89b60fb7a83',
      isWrapped: 0
    },
    {
      token: 'USDT',
      address: '0x4ECaBa5870353805a9F068101A40E0f32ed605C6',
      isWrapped: 0
    },
    {
      token: 'jEUR',
      address: '0x9fb1d52596c44603198fb0aee434fac3a679f702',
      isWrapped: 0
    },
    {
      token: 'jCHF',
      address: '0x2d5563da42b06fbbf9c67b7dc073cf6a7842239e',
      isWrapped: 0
    },
  ]
};

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (!['gnosis'].includes(network.name)) {
    return;
  }

  const { deployments, getNamedAccounts } = hre;
  const { deploy, execute } = deployments;

  const { deployer } = await getNamedAccounts();
  console.log(`Deployer: ${deployer}`);

  const PROXY_SETTINGS_WITH_UPGRADE = {
    owner: deployer,
    proxyContract: 'OpenZeppelinTransparentProxy',
    methodName: 'postUpgrade'
  };

  // Setup Ledger
  const ledgerDeploy = await deploy('Ledger', {
    contract: 'LedgerUpgradeable',
    proxy: PROXY_SETTINGS_WITH_UPGRADE,
    from: deployer,
    log: true,
    autoMine: true
  });

  if (ledgerDeploy.newlyDeployed) {
    console.log(`Contract Ledger deployed at ${ledgerDeploy.address} using ${ledgerDeploy.receipt?.gasUsed} gas`);
  }

  // Addresses that must be authorized on the Ledger contract
  const authorizedAddresses: string[] = [];

  // Asset deployment helper
  const deployAsset = async (asset: TokenConfig, ledgerAddress: string): Promise<void> => {
    const assetDeploy = await deploy(`${asset.token.toUpperCase()}Asset`, {
      contract: 'AssetUpgradeable',
      proxy: PROXY_SETTINGS_WITH_UPGRADE,
      from: deployer,
      log: true,
      autoMine: true,
      args: [ledgerAddress, asset.address, asset.isWrapped]
    });

    if (assetDeploy.newlyDeployed) {
      console.log(
        `Contract USDC Asset deployed at ${assetDeploy.address} using ${assetDeploy.receipt?.gasUsed} gas`
      );

      authorizedAddresses.push(assetDeploy.address);
    }

    // Authorize required addresses on the Ledger contract
  await Promise.all(
    authorizedAddresses.map((address) => execute('Ledger', { from: deployer, log: true }, 'rely', address))
  );

  await execute('WinPay', { from: deployer, log: true }, 'register', utils.keccak256(utils.formatBytes32String('win_win_provider')), deployer);
  };

  // Deploy assets
  for (const asset of tokens[network.name]) {
    await deployAsset(asset, ledgerDeploy.address);
  }

  // Setup WinPay contract
  const winPayDeploy = await deploy('WinPay', {
    contract: 'WinPayUpgradeable',
    proxy: PROXY_SETTINGS_WITH_UPGRADE,
    from: deployer,
    log: true,
    autoMine: true,
    args: [ledgerDeploy.address]
  });

  if (winPayDeploy.newlyDeployed) {
    console.log(`Contract WinPay deployed at ${winPayDeploy.address} using ${winPayDeploy.receipt?.gasUsed} gas`);

    authorizedAddresses.push(winPayDeploy.address);
  }

  // Authorize required addresses on the Ledger contract
  await Promise.all(
    authorizedAddresses.map((address) => execute('Ledger', { from: deployer, log: true }, 'rely', address))
  );
};

export default func;
func.tags = ['production'];
