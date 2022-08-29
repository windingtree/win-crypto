import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { MockERC20 } from '../typechain';
import { ethers, network } from 'hardhat';
import { utils } from 'ethers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (!['sokolOLD', 'polygon_mumbai'].includes(network.name)) {
    return;
  }

  const { deployments, getNamedAccounts } = hre;
  const { deploy, execute } = deployments;

  const { deployer } = await getNamedAccounts();
  console.log(`Deployer: ${deployer}`);

  // Add here some test addresses. These addresses will be loaded with test USDC
  const mockErc20Holders: string[] = [];

  const PROXY_SETTINGS_WITH_UPGRADE_TOKENS = {
    owner: deployer,
    proxyContract: 'OpenZeppelinTransparentProxy',
    execute: {
      init: {
        methodName: 'initialize',
        args: []
      }
    }
  };

  const PROXY_SETTINGS_WITH_UPGRADE = {
    owner: deployer,
    proxyContract: 'OpenZeppelinTransparentProxy',
    methodName: 'postUpgrade'
  };

  // Asset addresses
  const authorizedAddresses: string[] = [];

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

  // Setup MockERC20 (USDC) exists in both `sokol` and `polygon_mumbai`
  const usdcDeploy = await deploy('USDC', {
    contract: 'MockERC20Upgradeable',
    proxy: PROXY_SETTINGS_WITH_UPGRADE_TOKENS,
    from: deployer,
    log: true,
    autoMine: true
  });

  if (usdcDeploy.newlyDeployed) {
    console.log(`Token USDC deployed at ${usdcDeploy.address} using ${usdcDeploy.receipt?.gasUsed} gas`);

    const erc20Factory = await ethers.getContractFactory('MockERC20Upgradeable');
    const erc20 = erc20Factory.attach(usdcDeploy.address) as MockERC20;

    // mint tokens to each address
    const NUM_TOKENS = utils.parseEther('1000000');
    await Promise.all(mockErc20Holders.map((address) => erc20.mint(address, NUM_TOKENS)));
  }

  // Setup asset contract for MockERC20
  const usdcAssetDeploy = await deploy('USDCAsset', {
    contract: 'AssetUpgradeable',
    proxy: PROXY_SETTINGS_WITH_UPGRADE,
    from: deployer,
    log: true,
    autoMine: true,
    args: [ledgerDeploy.address, usdcDeploy.address, 0]
  });

  if (usdcAssetDeploy.newlyDeployed) {
    console.log(
      `Contract USDC Asset deployed at ${usdcAssetDeploy.address} using ${usdcAssetDeploy.receipt?.gasUsed} gas`
    );

    authorizedAddresses.push(usdcAssetDeploy.address);
  }

  // Sokol specific deployments
  if (network.name === 'sokol') {
    // Setup wrapped token MockWrappedERC20 only for `sokol`
    const wxdaiDeploy = await deploy('WXDAI', {
      contract: 'MockWrappedERC20Upgradeable',
      proxy: PROXY_SETTINGS_WITH_UPGRADE_TOKENS,
      from: deployer,
      log: true,
      autoMine: true
    });

    if (wxdaiDeploy.newlyDeployed) {
      console.log(`Token WXDAI deployed at ${wxdaiDeploy.address} using ${wxdaiDeploy.receipt?.gasUsed} gas`);
    }

    // Setup wrapped asset contract for MockWrappedERC20
    const wxdaiAssetDeploy = await deploy('WXDAIAsset', {
      contract: 'AssetUpgradeable',
      proxy: PROXY_SETTINGS_WITH_UPGRADE,
      from: deployer,
      log: true,
      autoMine: true,
      args: [ledgerDeploy.address, wxdaiDeploy.address, 1]
    });

    if (wxdaiAssetDeploy.newlyDeployed) {
      console.log(
        `Contract WXDAI Asset deployed at ${wxdaiAssetDeploy.address} using ${wxdaiAssetDeploy.receipt?.gasUsed} gas`
      );

      authorizedAddresses.push(wxdaiAssetDeploy.address);
    }
  }

  // Polygon Mumbai specific deployments
  if (network.name === 'polygon_mumbai') {
    // For the Mumbai network we already know address of EURe
    const EURE_ADDRESS = '0xCF487EFd00B70EaC8C28C654356Fb0E387E66D62'; // EURe

    // Setup asset contract for MockERC20
    const eureDeploy = await deploy('ERC20Asset', {
      contract: 'AssetUpgradeable',
      proxy: PROXY_SETTINGS_WITH_UPGRADE,
      from: deployer,
      log: true,
      autoMine: true,
      args: [ledgerDeploy.address, EURE_ADDRESS, 0]
    });

    if (eureDeploy.newlyDeployed) {
      console.log(`Contract EURe Asset deployed at ${eureDeploy.address} using ${eureDeploy.receipt?.gasUsed} gas`);

      authorizedAddresses.push(eureDeploy.address);
    }
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

  await execute('WinPay', { from: deployer, log: true }, 'register', utils.keccak256(utils.formatBytes32String('win_win_provider')), deployer);
};

export default func;
func.tags = ['staging'];
