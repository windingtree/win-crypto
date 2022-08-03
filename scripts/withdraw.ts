import { task } from 'hardhat/config';
import { getAssetContract } from './helpers';

// Funds withdrawal task
task('withdraw', 'Withdrawal of funds')
  .addParam('address', 'Asset contract address')
  .addParam('account', 'Providers account address')
  .addParam('dest', 'Destination address')
  .addParam('value', 'Amount of funds')
  .setAction(async (args, hre) => {
    const contract = await getAssetContract(hre, args.address, args.account);
    const tx = await contract.exit(
      args.dest,
      args.value
    );
    console.log('Withdrawal tx: ', tx.hash);
    await tx.wait();
    console.log(
      `Funds ${args.value} has been withdrawn successfully to the ${args.dest}`
    );
  });
