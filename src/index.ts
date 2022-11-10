import { ethers, Contract, Signature, Wallet, BigNumber } from 'ethers';

export const createPermitSignature = async (
  signer: Wallet,
  contract: Contract,
  owner: string,
  spender: string,
  value: BigNumber,
  deadline: number,
  salt?: string,
  versionOverride?: string
): Promise<Signature> => {
  const nonce = await contract.nonces(owner);
  const name = await contract.name();
  const version = versionOverride || '1';
  const chainId = await signer.getChainId();

  return ethers.utils.splitSignature(
    await signer._signTypedData(
      {
        name,
        version,
        chainId,
        verifyingContract: contract.address,
        ...salt ? { salt } : {}
      },
      {
        Permit: [
          {
            name: 'owner',
            type: 'address'
          },
          {
            name: 'spender',
            type: 'address'
          },
          {
            name: 'value',
            type: 'uint256'
          },
          {
            name: 'nonce',
            type: 'uint256'
          },
          {
            name: 'deadline',
            type: 'uint256'
          }
        ]
      },
      {
        owner,
        spender,
        value,
        nonce,
        deadline
      }
    )
  );
};
