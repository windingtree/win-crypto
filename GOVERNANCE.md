# WinPay governance

## WinPay management

### Repository setup

Clone and set up the WinPay repository

```bash
git clone git@github.com:windingtree/win-pay.git ./winpay
cd winpay
yarn
yarn compile
```

Create .env file

```bash
cp .env.template .env
```

- Add your wallet mnemonic phrase to the `.env`

```
#...
MNEMONIC=<your_mnemonic>
```

- Add proper provider URI for your network(s)

```
# network specific node URI: `"ETH_NODE_URI_" + networkName.toUpperCase()`
ETH_NODE_URI_GNOSIS=https://rpc.gnosischain.com
```

### Toggling state

The WinPay contract can be moved to the `paused` state (and otherwise) using the `toggle()`function.

- Run state toggling task

```bash
yarn scripts toggle --network gnosis \
	--address <WINPAY_ADDRESS>
	--account <sender_address>
```

### Upgrades

All the WinPay contracts are deployed using default `OpenZeppelinTransparentProxy`.

Currently, the address with index `0` from the configured wallet is allowed to make upgrades. In the future, this ownership must be moved to the multisig wallet.

All upgrades can be managed using deployment scripts from the WinPay repository. Each time when contracts are changed these deployment scripts must be changed according to a new contracts versions needs.

## Service providers

The service providers are authorized system actors who sell their services via the WinPay protocol.

### `providerId`

Each provider has its own unique `providerId`. A `providerId` must be `bytes32-formatted` string and can be generated in various ways.

Here is one of the possible ways how to create a provider Id.

```tsx
import { utils } from 'ethers';

const providerId = utils.id('derbysoft-proxy-provider');
// '0x5c3aba5488b96b516a2d76b524247e4f2dd2422ff463622ff5d39a05a7564010'
```

### Registration

The service provider must be registered on the WinPay contract using the function `register`. This function is not restricted and can be called by anyone.

Here is an example of a service provider registration script:

```tsx
import { utils } from 'ethers';
import { WinPayUpgradeable__factory } from '@windingtree/win-pay/dist/typechain';

const winPay = '<win_pay_contract_address>';
const providerWithSigner = '<network_provider_with_signer_or_signer>';

const providerId = utils.id('derbysoft-proxy-provider');
const providerAccount = '<authorized_account>'; // EOA or contract address

const contract = WinPayUpgradeable__factory
  .connect(winPay, providerWithSigner);

const tx = await contract.register(
  providerId,
  providerAccount
);
console.log('Provider registration tx: ', tx.hash);

await tx.wait();
console.log(`Provider ${providerId} has been registered successfully`);
```

The registration script is already included in the `WinPay` repository as a `hardhat` task. To use this script please follow these instructions.

> How to set up and configure the WinPay repository is described [here](https://www.notion.so/WinPay-governance-c1e6757030764bb08397f8cb055b8f89).
>
- Run registration task

```bash
yarn scripts register --network gnosis \
	--address <WINPAY_ADDRESS>\
	--name <provider_name>\
	--account <provider_account_address>
```

## Assets and balances

### Getting of balances

To be able to monitor balances of assets a service provider must know all the addresses of `tokens` contracts that are involved in the protocol (ERC20 compatible).

Addresses of these contracts are known from the deployment. Current addresses can be taken from [here](https://github.com/windingtree/win-pay#deployments).

In the WinPay protocol, balances are managed by the `Ledger` contract. The address of this contract can be obtained from the `WinPay` contract by calling the `ledger()` function.

To get a balance of a specific asset should be used the `balances(address,address)` function. The first argument of this function is the address of the registered service provider, and the second argument is the address of the specific `token` contract.

Example (staging environment).

- The address of `MockERC20` token is `0x0462C345320C7Ed3071cd1426e6B62472C5bA96d`
- The address of the service provider account is `0xA0B74BFE28223c9e08d6DBFa74B5bf4Da763f959`

To get a current balance of the asset (and represented token) must be sent the following call to the `Ledger` contract.

```tsx
const balance = await ledgerContract.balances(
	'0xA0B74BFE28223c9e08d6DBFa74B5bf4Da763f959',
	'0x0462C345320C7Ed3071cd1426e6B62472C5bA96d'
);
```

The code above will return the balance of the `MockERC20` token of the service provider account.

There is no way in the WinPay to fetch all the balances at once so it is required to iterate through the addresses and fetch the balance of each of them.

The script for getting balances is already included in the `WinPay` repository as a `hardhat` task. To use this script please follow these instructions.

> How to set up and configure the WinPay repository is described [here](https://www.notion.so/WinPay-governance-c1e6757030764bb08397f8cb055b8f89).
>
- Run balance task

```bash
yarn scripts balance --network gnosis \
	--address <LEDGER_ADDRESS>\
	--account <provider_account_address>\
  --provider <provider_id>\
  --asset <token_contract_address>
```

### Withdrawal of funds

Because “physically” funds (tokens) are handled in the WinPay protocol by an associated `Asset` contract funds withdrawal is possible only there.

To make a withdrawal it is required to send a transaction to a certain `Asset` contract to the function `exit(address,uint256)`. The first argument is the destination address where you want to send funds. The second argument is the value (amount) of funds.

The function `exit` can be called by the registered service provider account only.

The withdrawal script is already included in the `WinPay` repository as a `hardhat` task. To use this script please follow these instructions.

> How to set up and configure the WinPay repository is described [here](https://www.notion.so/WinPay-governance-c1e6757030764bb08397f8cb055b8f89).
>
- Run withdrawal task

```bash
yarn scripts withdraw --network gnosis \
	--address <ASSET_ADDRESS>\
	--account <provider_account_address>\
  --dest <destination_address>\
	--value <amount>
```

### Refunds

Refunds of funds can be initiated by the registered service provider. To be able to refund funds the service provider should know the proper `serviceId` of the `Deal` made on the `WinPay` contract.

To make refunds should be used the `refund(bytes32,address)` function of the `WinPay` contract.

The first argument is the `serviceId` that has been used for making the deal. The second argument is the address of the certain `Asset` contract.

When the `refund` function is called and a refund is made the `Deal` is moved to the `REFUNDED` state (`2`). The same `Deal` cannot be refunded twice.

The refund script is already included in the `WinPay` repository as a `hardhat` task. To use this script please follow these instructions.

> How to set up and configure the WinPay repository is described [here](https://www.notion.so/WinPay-governance-c1e6757030764bb08397f8cb055b8f89).
>
- Run registration task

```bash
yarn scripts refund --network gnosis \
	--address <WINPAY_ADDRESS>\
	--account <provider_account_address>\
  --serviceId <service_id_of_the_deal>\
  --asset <asset_address>
```
