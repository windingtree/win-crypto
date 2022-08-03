import { task } from 'hardhat/config';
import { getLedgerContract } from './helpers';

// Getting of balances task
task('balance', 'Getting balances of assets')
  .addParam('address', 'Ledger contract address')
  .addParam('account', 'Providers account address')
  .addParam('provider', 'Providers Id')
  .addParam('asset', 'Token contract address')
  .setAction(async (args, hre) => {
    const contract = await getLedgerContract(hre, args.address, args.account);
    const balance = await contract.balances(
      args.provider,
      args.asset
    );
    console.log(
      `Balance of (${balance}): ${balance.toString()}`
    );
  });
