import { task } from 'hardhat/config';
import { getWinPayContract } from './helpers';

// Refunds task
task('refund', 'Refund of the deal')
  .addParam('address', 'WinPay contract address')
  .addParam('account', 'Providers account address')
  .addParam('serviceId', 'Service  Id')
  .addParam('asset', 'Asset  contract address')
  .setAction(async (args, hre) => {
    const contract = await getWinPayContract(hre, args.address, args.account);
    const tx = await contract.refund(
      args.serviceId,
      args.asset
    );
    console.log('Refund tx: ', tx.hash);
    await tx.wait();
    console.log(
      `The deal ${args.serviceId} has been refunded successfully`
    );
  });
