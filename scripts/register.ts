import { task } from 'hardhat/config';
import { utils } from 'ethers';
import { getWinPayContract } from './helpers';

// Provider registration task
task('register', 'Register a service provider')
  .addParam('address', 'WinPay contract address')
  .addParam('provider', 'Service provider name')
  .addParam('wallet', 'Service provider wallet account')
  .addParam('account', 'Providers account address')
  .setAction(async (args, hre) => {
    const contract = await getWinPayContract(hre, args.address, args.account);
    const providerId = utils.id(args.provider);
    const providerWallet = args.wallet || args.account;
    console.log('Service provider Id:', providerId);
    console.log('Service provider wallet:', providerWallet);
    const tx = await contract.register(
      providerId,
      providerWallet
    );
    console.log('Provider registration tx: ', tx.hash);
    await tx.wait();
    console.log(`Provider ${providerId} has been registered successfully`);
  });
