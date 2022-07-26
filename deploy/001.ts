import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { MockERC20, MockWrappedERC20 } from '../typechain';
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

  // --- Deploy the contract
  const mockErc20Deploy = await deploy('MockERC20', {
    from: deployer,
    log: true,
    autoMine: true
  });

  if (mockErc20Deploy.newlyDeployed) {
    console.log(
      `Contract MockERC20 deployed at ${mockErc20Deploy.address} using ${mockErc20Deploy.receipt?.gasUsed} gas`
    );

    const erc20Factory = await ethers.getContractFactory('MockERC20');
    const erc20 = erc20Factory.attach(mockErc20Deploy.address) as MockERC20;

    // mint tokens to each address
    const NUM_TOKENS = utils.parseEther('1000000');
    await Promise.all([alice, bob, carol].map((address) => erc20.mint(address, NUM_TOKENS)));
  }

  const mockWrappedErc20Deploy = await deploy('MockWrappedERC20', {
    from: deployer,
    log: true,
    autoMine: true
  });

  if (mockWrappedErc20Deploy.newlyDeployed) {
    console.log(
      `Contract MockWrappedERC20 deployed at ${mockWrappedErc20Deploy.address} using ${mockWrappedErc20Deploy.receipt?.gasUsed} gas`
    );

    const erc20Factory = await ethers.getContractFactory('MockWrappedERC20');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const wrappedErc20 = erc20Factory.attach(mockErc20Deploy.address) as MockWrappedERC20;
  }

  const ledgerDeploy = await deploy('Ledger', {
    from: deployer,
    log: true,
    autoMine: true
  });

  if (ledgerDeploy.newlyDeployed) {
    console.log(`Contract Ledger deployed at ${ledgerDeploy.address} using ${ledgerDeploy.receipt?.gasUsed} gas`);
  }

  const assetErc20Deploy = await deploy('Asset', {
    contract: 'Asset',
    from: deployer,
    log: true,
    autoMine: true,
    args: [ledgerDeploy.address, mockErc20Deploy.address, 0]
  });

  if (assetErc20Deploy.newlyDeployed) {
    console.log(
      `Contract Asset (erc20) deployed at ${assetErc20Deploy.address} using ${assetErc20Deploy.receipt?.gasUsed} gas`
    );

    await execute('Ledger', { from: deployer, log: true }, 'rely', assetErc20Deploy.address);
  }

  const assetWrappedErc20Deploy = await deploy('WrappedAsset', {
    contract: 'Asset',
    from: deployer,
    log: true,
    autoMine: true,
    args: [ledgerDeploy.address, mockWrappedErc20Deploy.address, 1]
  });

  if (assetWrappedErc20Deploy.newlyDeployed) {
    console.log(
      `Contract Asset (wrappedErc20) deployed at ${assetWrappedErc20Deploy.address} using ${assetWrappedErc20Deploy.receipt?.gasUsed} gas`
    );

    await execute('Ledger', { from: deployer, log: true }, 'rely', assetWrappedErc20Deploy.address);
  }

  const winPayDeploy = await deploy('WinPay', {
    from: deployer,
    log: true,
    autoMine: true,
    args: [ledgerDeploy.address]
  });

  if (winPayDeploy.newlyDeployed) {
    console.log(`Contract WinPay deployed at ${winPayDeploy.address} using ${winPayDeploy.receipt?.gasUsed} gas`);

    await execute('Ledger', { from: deployer, log: true }, 'rely', winPayDeploy.address);
  }
};

export default func;
func.tags = ['MockERC20', 'MockWrappedERC20', 'Ledger', 'Asset', 'WinPay'];
