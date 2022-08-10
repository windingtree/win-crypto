import { task } from 'hardhat/config';
import { MockERC20Upgradeable__factory } from '../typechain';

// Tokens minting task
task('mintTest', 'Mint test tokens')
  .addParam('address', 'Contract address')
  .addParam('owner', 'Contract owner address')
  .addParam('to', 'For whom address')
  .addParam('amount', 'Amount of tokens')
  .setAction(async (args, hre) => {
    const signer = await hre.ethers.getSigner(args.owner);
    const contract = MockERC20Upgradeable__factory
      .connect(args.address, signer);
    const tx = await contract.mint(
      args.to,
      args.amount
    );
    console.log('Minting tx: ', tx.hash);
    await tx.wait();
    console.log(`${args.amount} has been minted to ${args.to} successfully`);
  });
