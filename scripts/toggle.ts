import { task } from 'hardhat/config';
import { utils } from 'ethers';
import { getWinPayContract } from './helpers';

// WinPay contract state toggling task
task('toggle', 'Toggling WinPay contract state')
  .addParam('address', 'WinPay contract address')
  .addParam('account', 'Providers account address')
  .setAction(async (args, hre) => {
    const contract = await getWinPayContract(hre, args.address, args.account);
    const providerId = utils.id(args.provider);
    const tx = await contract.register(
      providerId,
      args.account
    );
    console.log('Contract state toggling tx: ', tx.hash);
    await tx.wait();
    console.log('Current state toggled successfully');
    console.log(
      'Current state:',
      (await contract.live()).isZero() ? 'paused' : 'active'
    );
  });
