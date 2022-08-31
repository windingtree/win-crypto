import { task } from 'hardhat/config';
import { getLedgerContract, getErc20Contract } from './helpers';

// Getting of balances task
task('balance', 'Getting balances of assets')
  .addParam('address', 'Ledger contract address')
  .addParam('account', 'Current account address')
  .addParam('provider', 'Wallet address of the provider')
  .addParam('asset', 'Token contract address')
  .setAction(async (args, hre) => {
    const contract = await getLedgerContract(hre, args.address, args.account);
    const balance = await contract.balances(
      args.provider,
      args.asset
    );
    const token = await getErc20Contract(hre, args.asset, args.account);
    const tokenSymbol =  await token.symbol();
    console.log(
      `Balance of ${args.provider}: ${balance.toString()} ${tokenSymbol}`
    );
  });
