import { LedgerUpgradeable__factory } from '../typechain';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, network } from 'hardhat';

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
  ],
  polygon: [
    {
      token: 'DAI',
      address: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
      isWrapped: 0
    },
    {
      token: 'USDC',
      address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
      isWrapped: 0
    },
    {
      token: 'USDT',
      address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',//no permit
      isWrapped: 0
    },
    {
      token: 'EURE',
      address: '0x18ec0A6E18E5bc3784fDd3a3634b31245ab704F6',//no permit
      isWrapped: 0
    },
    {
      token: 'EURS',
      address: '0xe111178a87a3bff0c8d18decba5798827539ae99',//no permit
      isWrapped: 0
    },
    {
      token: 'jEUR',
      address: '0x4e3decbb3645551b8a19f0ea1678079fcb33fb4c',
      isWrapped: 0
    },
    {
      token: 'jCHF',
      address: '0xbd1463f02f61676d53fd183c2b19282bff93d099',
      isWrapped: 0
    },
    {
      token: 'jGBP',
      address: '0x767058f11800fba6a682e73a6e79ec5eb74fac8c',
      isWrapped: 0
    },
    {
      token: 'jAUD',
      address: '0xcb7f1ef7246d1497b985f7fc45a1a31f04346133',
      isWrapped: 0
    },
    {
      token: 'jCAD',
      address: '0x8ca194a3b22077359b5732de53373d4afc11dee3',
      isWrapped: 0
    },
    {
      token: 'jJPY',
      address: '0x8343091f2499fd4b6174a46d067a920a3b851ff9',
      isWrapped: 0
    },
    {
      token: 'jSEK',
      address: '0x197e5d6ccff265ac3e303a34db360ee1429f5d1a',
      isWrapped: 0
    },
    {
      token: 'jSGD',
      address: '0xa926db7a4cc0cb1736d5ac60495ca8eb7214b503',
      isWrapped: 0
    },
    {
      token: 'jPLN',
      address: '0x08E6d1F0c4877Ef2993Ad733Fc6F1D022d0E9DBf',
      isWrapped: 0
    },
  ],
};

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (!['gnosis', 'polygon'].includes(network.name)) {
    return;
  }

  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  console.log(`Deployer: ${deployer}`);

  const PROXY_SETTINGS_WITH_UPGRADE = {
    owner: deployer,
    proxyContract: 'OpenZeppelinTransparentProxy'
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
        `${asset.token} Asset deployed at ${assetDeploy.address} using ${assetDeploy.receipt?.gasUsed} gas`
      );
    }

    authorizedAddresses.push(assetDeploy.address);
  };

  // Deploy assets
  for (const asset of tokens[network.name]) {
    await deployAsset(asset, ledgerDeploy.address);
    // Wait before next deployment
    await new Promise(resolve => setTimeout(resolve, 1000));
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
  }

  authorizedAddresses.push(winPayDeploy.address);

  // Authorize required addresses on the Ledger contract
  const ledgerFactory = await ethers.getContractFactory<LedgerUpgradeable__factory>('LedgerUpgradeable');
  const ledger = ledgerFactory.attach(ledgerDeploy.address);

  // List of authorized addresses
  console.log('Authorized by the Ledger');
  for (const address of authorizedAddresses) {
    const auth = await ledger.auth(address);
    if (auth.eq(ethers.BigNumber.from(0))) {
      await ledger.rely(address, { from: deployer });
    }
    console.log('Authorized:', address);
  }
};

export default func;
func.tags = ['production'];
