# WinPay
Win.so crypto payments manager contract

## Overview

The `WinPay` contract is dedicated to handling payments in stable coins for service.

To start accepting payments the service must be registered in the contract.

Every payment can be limited in time, so if your offer has expiration your payments will arrive in time or not at all.

Every payment will be linked to the unique service Id to make a reference between your off-chain accounting system and on-chain payment in crypto.

## Commits

To commit to the repository after staging the commit:

```bash
yarn commit
```

Select the appropriate type of commit message, any issues to close, and note any breaking
changes.

## Tests

Test are handled with `chai` and includes `solidity-coverage`, enabling coverage
reports to be done for the code-base. By default, contracts located in `contracts/test`
are ignored by `solidity-coverage`.

## Deployment

### Requirements

1. Ensure **100% solidity coverage** in tests prior to production deployment.
2. All `Ownable` contracts **MUST** have their owner set to the community multi-sig and/or
   `TimelockController`. **NO** contracts must be allowed to retain **ANY** deployer addresses
   in their configuration.
3. **MINIMUM** two reviewers prior to committing to the main branch.

### Scripts

This repository uses `hardhat-deploy` for reproducible deployment tests, as well as:

1. Get contracts via name from `ethers`.
2. Named accounts for more readable tests.
3. Conditional logic execution based on tagged network deploying to (allowing for more
   complex logic when deploying across multiple chains, and/or testnets).

Deployment scripts are contained within `deploy`, and these deployment scripts are executed
prior to any tests, and are executed in **alphabetical order**.

### How to use

Unit testing:

```
yarn test
```

Coverage analysis:

```
yarn hardhat coverage
```

Run deploy scripts and deploy to `mainnet`:

```
yarn hardhat deploy --network mainnet
```

Now verify the contracts on Etherscan:

```
yarn hardhat --network mainnet etherscan-verify
```

**NOTE: Substitute `mainnet` above for the applicable target network.**
