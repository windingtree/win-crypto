import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, network } from 'hardhat';
import { utils } from 'ethers';

export interface TestTokenConfig {
  name: string;
  symbol: string;
  contract: string;
  isWrapped: number;
}

export interface TestNetworkTokens {
  [network: string]: TestTokenConfig[];
}

const tokens: TestNetworkTokens = {
  sokol: [
    {
      name: 'wxDAI',
      symbol: 'wxDAI',
      contract: 'MockWrappedERC20Dec18Upgradeable',
      isWrapped: 1
    },
    {
      name: 'USDC',
      symbol: 'USDC',
      contract: 'MockERC20Dec6PermitUpgradeable',
      isWrapped: 0
    },
    {
      name: 'EURs',
      symbol: 'EURs',
      contract: 'MockERC20Dec18Upgradeable',
      isWrapped: 0
    },
    {
      name: 'JPYC',
      symbol: 'JPYC',
      contract: 'MockERC20Dec18PermitUpgradeable',
      isWrapped: 0
    }
  ]
};

const defaultTokensMint = utils.parseEther('10000000');

const mockErc20Holders: string[] = [];

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (!['sokol'].includes(network.name)) {
    return;
  }

  const { deployments, getNamedAccounts } = hre;
  const { deploy, execute } = deployments;

  const { deployer } = await getNamedAccounts();
  console.log(`Deployer: ${deployer}`);

  const PROXY_SETTINGS_WITH_UPGRADE = {
    owner: deployer,
    proxyContract: 'OpenZeppelinTransparentProxy'
  };

  // Asset addresses
  const authorizedAddresses: string[] = [];

  // Setup Ledger
  const ledgerDeploy = await deploy('Ledger', {
    contract: 'LedgerUpgradeable',
    proxy: {
      ...PROXY_SETTINGS_WITH_UPGRADE,
      methodName: 'postUpgrade'
    },
    from: deployer,
    log: true,
    autoMine: true
  });

  if (ledgerDeploy.newlyDeployed) {
    console.log(`Contract Ledger deployed at ${ledgerDeploy.address} using ${ledgerDeploy.receipt?.gasUsed} gas`);
  }

  // Setup Asset contract for token
  const deployAsset = async (token: TestTokenConfig, tokenAddress: string): Promise<void> => {
    const asset = `${token.symbol}Asset`;
    const assetDeploy = await deploy(asset, {
      contract: 'AssetUpgradeable',
      proxy: PROXY_SETTINGS_WITH_UPGRADE,
      from: deployer,
      log: true,
      autoMine: true,
      args: [ledgerDeploy.address, tokenAddress, token.isWrapped]
    });

    if (assetDeploy.newlyDeployed) {
      console.log(
        `Contract ${token.symbol}Asset deployed at ${assetDeploy.address} using ${assetDeploy.receipt?.gasUsed} gas`
      );
    }

    authorizedAddresses.push(assetDeploy.address);

    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const deployToken = async (token: TestTokenConfig): Promise<void> => {
    const tokenDeploy = await deploy(`${token.symbol}`, {
      contract: token.contract,
      proxy: {
        ...PROXY_SETTINGS_WITH_UPGRADE,
        execute: {
          init: {
            methodName: 'initialize',
            args: [token.name, token.symbol]
          }
        }
      },
      from: deployer,
      log: true,
      autoMine: true
    });

    if (tokenDeploy.newlyDeployed) {
      console.log(`Token ${token.symbol} deployed at ${tokenDeploy.address} using ${tokenDeploy.receipt?.gasUsed} gas`);

      for (const holderAddress of mockErc20Holders) {
        await execute(token.symbol, { from: deployer, log: true }, 'mint', holderAddress, defaultTokensMint);
        console.log(`Holder ${holderAddress} gets ${defaultTokensMint.toString()} ${token.symbol}`);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await deployAsset(token, tokenDeploy.address);
  };

  // Setup tokens
  for (const token of tokens[network.name]) {
    await deployToken(token);
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

  // await execute(
  //   'WinPay',
  //   { from: deployer, log: true },
  //   'register',
  //   '0x394e5c06a83eeea7fd8e0e50bb1ff1f13bec1a4e353a9a0f6db9dea030bcbef3',
  //   deployer
  // );

  const ledgerFactory = await ethers.getContractFactory('LedgerUpgradeable');
  const ledger = ledgerFactory.attach(ledgerDeploy.address);

  // Authorize required addresses on the Ledger contract
  for (const address of authorizedAddresses) {
    const auth = await ledger.auth(address);
    if (auth.eq(ethers.BigNumber.from(0))) {
      await execute('Ledger', { from: deployer, log: true }, 'rely', address);
      console.log(`Authorized on Ledger: ${address}`);
    } else {
      console.log('Already Authorized:', address);
    }
  }
};

export default func;
func.tags = ['staging'];
