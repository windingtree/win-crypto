// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.13;

import {Manageable} from './Manageable.sol';
import {Permit} from './libraries/Permit.sol';
import {AssetLike, WrappedErc20Like, LedgerLike} from './interfaces/Common.sol';

contract WinPay is Manageable {
  enum State {
    UNINITIALIZED,
    PAID,
    REFUNDED
  }

  struct DealStorage {
    bytes32 provider;
    address customer;
    address asset;
    uint256 value;
    State state;
  }

  /// @dev Reference to Ledger contract
  LedgerLike public ledger;

  /// @dev Service providers registry
  mapping(bytes32 => address) public providers; // provider => EOA

  /// @dev Deals registry
  mapping(bytes32 => DealStorage) public deals; // serviceId => DealStorage

  // -- errors

  /// @dev Throws when provider is already registered
  error ProviderExists();

  /// @dev Throws when provider not found
  error ProviderNotFound(bytes32 provider);

  /// @dev Throws when the deal is already initialized
  error DealExists(bytes32 serviceId);

  /// @dev Throws when the deal not found
  error DealNotFound(bytes32 serviceId);

  /// @dev Throws when the deal is expired
  error DealExpired(bytes32 serviceId, uint256 expiry);

  /// @dev Throws when the deal is already refunded
  error DealAlreadyRefunded(bytes32 serviceId);

  /// @dev Throws when invalid value provided
  error InvalidValue();

  /// @dev Throws when balance not enough for payment
  error BalanceNotEnough();

  // -- events

  /// @dev Emitted when the provider is registered or changed
  event Provider(bytes32 provider, address wallet);

  /// @dev Emitted when deal is occurred
  event Deal(bytes32 provider, bytes32 serviceId);

  /// @dev Emitted when deal is refunded
  event Refund(bytes32 provider, bytes32 serviceId);

  constructor(address _ledger) {
    auth[msg.sender] = 1;
    live = 1;
    ledger = LedgerLike(_ledger);
    emit Rely(msg.sender);
  }

  /// @dev Register a new provider
  /// @param provider Unique provider Id
  /// @param wallet Provider's wallet
  function register(bytes32 provider, address wallet) external onlyLive {
    if (providers[provider] != address(0)) {
      revert ProviderExists();
    }
    providers[provider] = wallet;
    emit Provider(provider, wallet);
  }

  /// @dev Update the provider
  /// @param provider Unique provider Id
  /// @param wallet Provider's wallet
  function updateProvider(bytes32 provider, address wallet) external onlyLive {
    if (msg.sender != providers[provider]) {
      revert NotAuthorized();
    }
    providers[provider] = wallet;
    emit Provider(provider, wallet);
  }

  // --- deals

  /// @dev Makes a deal
  /// @param provider Unique provider Id
  /// @param serviceId Unique service Id
  /// @param expiry The timestamp at which the deal is no longer valid
  /// @param asset The address of the proper Asset implementation
  /// @param permit Data required for making of payment with tokens using permit
  function _deal(
    bytes32 provider,
    bytes32 serviceId,
    uint256 expiry,
    address asset,
    uint256 value,
    Permit.EIP2612Permit memory permit
  ) internal onlyLive {
    // make sure provider registered
    if (providers[provider] == address(0)) {
      revert ProviderNotFound(provider);
    }

    DealStorage storage dealStorage = deals[serviceId];

    // make sure the deal has not been created before
    if (dealStorage.state != State.UNINITIALIZED) {
      revert DealExists(serviceId);
    }

    // make sure the deal is not expired
    if (expiry < block.timestamp) {
      revert DealExpired(serviceId, expiry);
    }

    AssetLike assetInstance = AssetLike(asset);
    address assetAddress = assetInstance.asset();

    // when asset is `wrapped` we should try to `wrap` native tokens
    if (assetInstance.wrapped() > 0 && msg.value > 0) {
      if (msg.value != value) {
        revert InvalidValue();
      }
      assetInstance.joinWrapped{value: msg.value}(providers[provider], value);
    } else if (permit.owner != address(0)) {
      // we have a permission from the customer, so, use it
      assetInstance.join(msg.sender, providers[provider], value, permit);
    } else {
      // normal asset joining
      assetInstance.join(msg.sender, providers[provider], value);
    }

    dealStorage.provider = provider;
    dealStorage.customer = msg.sender;
    dealStorage.asset = assetAddress;
    dealStorage.value = value;
    dealStorage.state = State.PAID;

    emit Deal(provider, serviceId);
  }

  // `deal` version without `permit` functionality
  function deal(
    bytes32 provider,
    bytes32 serviceId,
    uint256 expiry,
    address asset,
    uint256 value
  ) external payable onlyLive {
    _deal(provider, serviceId, expiry, asset, value, Permit.EIP2612Permit(address(0), 0, 0, bytes32(0), bytes32(0)));
  }

  // `deal` version with `permit`
  function deal(
    bytes32 provider,
    bytes32 serviceId,
    uint256 expiry,
    address asset,
    uint256 value,
    Permit.EIP2612Permit memory permit
  ) external onlyLive {
    _deal(provider, serviceId, expiry, asset, value, permit);
  }

  /// @dev Refunds a deal
  /// @param serviceId Unique service Id
  /// @param asset The Asset contract reference
  function refund(bytes32 serviceId, address asset) external onlyLive {
    DealStorage storage dealStorage = deals[serviceId];

    // make sure the deal is exists
    if (dealStorage.state == State.UNINITIALIZED) {
      revert DealNotFound(serviceId);
    }

    // make sure function called by the proper provider
    if (msg.sender != providers[dealStorage.provider]) {
      revert NotAuthorized();
    }

    // make sure the deal has not been refunded
    if (dealStorage.state == State.REFUNDED) {
      revert DealAlreadyRefunded(serviceId);
    }

    // check provider's balance
    if (ledger.balances(providers[dealStorage.provider], dealStorage.asset) < dealStorage.value) {
      revert BalanceNotEnough();
    }

    // finalize the deal state
    dealStorage.state = State.REFUNDED;

    // take funds from the providers' account to the WinPay contract
    ledger.move(providers[dealStorage.provider], address(this), dealStorage.asset, dealStorage.value);
    // ...and send them to the customer
    AssetLike(asset).exit(dealStorage.customer, dealStorage.value);

    emit Refund(dealStorage.provider, serviceId);
  }

  uint256[50] private __gap;
}
