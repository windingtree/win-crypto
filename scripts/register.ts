import { task } from 'hardhat/config';
import { utils } from 'ethers';
import { WinPayUpgradeable__factory } from '../typechain';

// Provider registration task
task('registerProvider', 'Register a service provider')
  .addParam('address', 'WinPay contract address')
  .addParam('owner', 'Providers owner address')
  .addParam('provider', 'Service provider Id')
  .setAction(async (args, hre) => {
    const signer = await hre.ethers.getSigner(args.owner);
    const providerId = utils.keccak256(utils.formatBytes32String('win_win_provider'));
    const contract = WinPayUpgradeable__factory
      .connect(args.address, signer);
    const tx = await contract.register(
      providerId,
      args.owner
    );
    console.log('Provider registration tx: ', tx.hash);
    await tx.wait();
    console.log(`Provider ${providerId} has been registered successfully`);
  });
