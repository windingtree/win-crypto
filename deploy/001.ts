import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { MockERC20Dec18, MockWrappedERC20Dec18 } from '../typechain';
import { ethers, network } from 'hardhat';
import { utils } from 'ethers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (!['hardhat', 'ganache', 'localhost'].includes(network.name)) {
    return;
  }

  const { deployments, getNamedAccounts } = hre;
  const { deploy, execute } = deployments;

  const { deployer, alice, bob, carol } = await getNamedAccounts();

  // --- Account listing ---
  console.log(`Deployer: ${deployer}`);
  console.log(`Alice: ${alice}`);
  console.log(`Bob: ${bob}`);
  console.log(`Carol: ${carol}`);

  const PROXY_SETTINGS_WITH_UPGRADE = {
    owner: deployer,
    proxyContract: 'OpenZeppelinTransparentProxy'
  };

  // --- Deploy the contract
  const mockErc20Deploy = await deploy('MockERC20Dec18Permit', {
    from: deployer,
    args: ['MockERC20Dec18Permit', 'MockERC20Dec18Permit'],
    log: true,
    autoMine: true
  });

  if (mockErc20Deploy.newlyDeployed) {
    console.log(
      `Contract MockERC20Dec18Permit deployed at ${mockErc20Deploy.address} using ${mockErc20Deploy.receipt?.gasUsed} gas`
    );

    const erc20Factory = await ethers.getContractFactory('MockERC20Dec18');
    const erc20 = erc20Factory.attach(mockErc20Deploy.address) as MockERC20Dec18;

    // mint tokens to each address
    const NUM_TOKENS = utils.parseEther('1000000');
    await Promise.all([alice, bob, carol].map((address) => erc20.mint(address, NUM_TOKENS)));
  }

  const mockWrappedErc20Deploy = await deploy('MockWrappedERC20Dec18', {
    from: deployer,
    args: ['MockWrappedERC20Dec18', 'MockWrappedERC20Dec18'],
    log: true,
    autoMine: true
  });

  if (mockWrappedErc20Deploy.newlyDeployed) {
    console.log(
      `Contract MockWrappedERC20Dec18 deployed at ${mockWrappedErc20Deploy.address} using ${mockWrappedErc20Deploy.receipt?.gasUsed} gas`
    );

    const erc20Factory = await ethers.getContractFactory('MockWrappedERC20Dec18');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const wrappedErc20 = erc20Factory.attach(mockErc20Deploy.address) as MockWrappedERC20Dec18;
  }

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

  const deployAsset = async (name: string, ercAddress: string, isWrapped: number) => {
    // Asset V1
    let assetErc20Deploy = await deploy(name, {
      contract: 'AssetUpgradeableV1',
      proxy: {
        ...PROXY_SETTINGS_WITH_UPGRADE,
        methodName: 'postUpgrade'
      },
      from: deployer,
      log: true,
      autoMine: true,
      args: [ledgerDeploy.address, ercAddress, isWrapped]
    });

    if (assetErc20Deploy.newlyDeployed) {
      console.log(
        `Contract ${name} V1 (erc20) deployed at ${assetErc20Deploy.address} using ${assetErc20Deploy.receipt?.gasUsed} gas`
      );

      await execute('Ledger', { from: deployer, log: true }, 'rely', assetErc20Deploy.address);
    }

    // Asset upgrade V1 -> V2
    assetErc20Deploy = await deploy(name, {
      contract: 'AssetUpgradeableV2',
      proxy: {
        ...PROXY_SETTINGS_WITH_UPGRADE
      },
      from: deployer,
      log: true,
      autoMine: true,
      args: [ledgerDeploy.address, ercAddress, isWrapped]
    });

    if (assetErc20Deploy.newlyDeployed) {
      console.log(
        `Contract ${name} (erc20) upgraded from V1 to V2 at ${assetErc20Deploy.address} using ${assetErc20Deploy.receipt?.gasUsed} gas`
      );
    }

    // Asset upgrade V2 -> V3
    assetErc20Deploy = await deploy(name, {
      contract: 'AssetUpgradeable',
      proxy: {
        ...PROXY_SETTINGS_WITH_UPGRADE
      },
      from: deployer,
      log: true,
      autoMine: true,
      args: [ledgerDeploy.address, ercAddress, isWrapped]
    });

    if (assetErc20Deploy.newlyDeployed) {
      console.log(
        `Contract ${name} (erc20) upgraded from V2 to V3 at ${assetErc20Deploy.address} using ${assetErc20Deploy.receipt?.gasUsed} gas`
      );
    }

    const assetFactory = await ethers.getContractFactory('AssetUpgradeable');
    const asset = assetFactory.attach(assetErc20Deploy.address);
    const assetAddress = await asset.asset();

    if (assetAddress !== ercAddress) {
      await asset['set(bytes32,address)'](
        utils.formatBytes32String('asset'),
        ercAddress,
        {
          from: deployer
        }
      );
      console.log('Fixed asset address:', ercAddress);
    }

    const ledgerAddress = await asset.ledger();

    if (ledgerAddress !== ledgerDeploy.address) {
      await asset['set(bytes32,address)'](
        utils.formatBytes32String('ledger'),
        ledgerDeploy.address,
        {
          from: deployer
        }
      );
      console.log('Fixed ledger address:', ercAddress);
    }

    const wrapped = await asset.wrapped();

    if (wrapped.toNumber() !== isWrapped) {
      await asset['set(bytes32,uint256)'](
        utils.formatBytes32String('wrapped'),
        isWrapped,
        {
          from: deployer
        }
      );
      console.log('Fixed ledger address:', ercAddress);
    }
  };

  await deployAsset('Asset', mockErc20Deploy.address, 0);
  await deployAsset('WrappedAsset', mockWrappedErc20Deploy.address, 1);

  const winPayDeploy = await deploy('WinPay', {
    contract: 'WinPayUpgradeable',
    proxy: {
      ...PROXY_SETTINGS_WITH_UPGRADE,
      methodName: 'postUpgrade'
    },
    from: deployer,
    log: true,
    autoMine: true,
    args: [ledgerDeploy.address]
  });

  if (winPayDeploy.newlyDeployed) {
    console.log(`Contract WinPay deployed at ${winPayDeploy.address} using ${winPayDeploy.receipt?.gasUsed} gas`);

    await execute('Ledger', { from: deployer, log: true }, 'rely', winPayDeploy.address);
    await execute('WinPay', { from: deployer, log: true }, 'register', utils.keccak256(utils.formatBytes32String('win_win_provider')), deployer);
  }
};

export default func;
func.tags = ['MockERC20', 'MockWrappedERC20', 'Ledger', 'Asset', 'WinPay'];
