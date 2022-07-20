// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.13;

import {Manageable} from './Manageable.sol';
import {Permit} from './libraries/Permit.sol';

interface AssetLike {
  function asset() external returns (address);

  function join(address dest, uint256 value) external;

  function join(
    address src,
    address dest,
    uint256 value
  ) external;

  function join(
    address src,
    address dest,
    uint256 value,
    Permit.EIP2612Permit memory permit
  ) external;

  function exit(address dest, uint256 value) external;
}

contract WinPay is Manageable {
  enum State {
    UNINITIALIZED,
    PAID,
    REFUNDED,
    WITHDRAWN
  }

  struct DealStorage {
    bytes32 provider;
    address asset;
    uint256 value;
    uint256 timestamp;
    State state;
  }

  /// @dev Service providers registry
  mapping(bytes32 => address) public providers;

  /// @dev Deals registry
  mapping(bytes32 => DealStorage) public deals;

  // -- errors

  /// @dev Throws when provider is already registered
  error ProviderExists(bytes32 provider);

  /// @dev Throws when provider not found
  error ProviderNotFound(bytes32 provider);

  /// @dev Throws when the deal is already initialized
  error DealExists(bytes32 serviceId);

  /// @dev Throws when the deal is expired
  error DealExpired(bytes32 serviceId, uint256 expiry);

  // -- events

  /// @dev Emitted when the provider is registered or changed
  event Provider(bytes32 provider, address wallet);

  /// @dev Emitted when deal is occurred
  event Deal(bytes32 provider, bytes32 serviceId);

  constructor() {
    auth[msg.sender] = 1;
    live = 1;
    emit Rely(msg.sender);
  }

  /// @dev Register a new provider
  /// @param provider Unique provider Id
  /// @param wallet Provider's wallet
  function register(bytes32 provider, address wallet) external {
    if (providers[provider] != address(0)) {
      revert ProviderExists(provider);
    }
    providers[provider] = wallet;
    emit Provider(provider, wallet);
  }

  /// @dev Update the provider
  /// @param provider Unique provider Id
  /// @param wallet Provider's wallet
  function updateProvider(bytes32 provider, address wallet) external {
    if (providers[provider] != msg.sender) {
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
  function _deal(
    bytes32 provider,
    bytes32 serviceId,
    uint256 expiry,
    address asset,
    uint256 value,
    Permit.EIP2612Permit memory permit
  ) internal onlyLive {
    if (providers[provider] == address(0)) {
      revert ProviderNotFound(provider);
    }
    DealStorage storage dealStorage = deals[serviceId];
    if (dealStorage.state != State.UNINITIALIZED) {
      revert DealExists(serviceId);
    }
    if (expiry >= block.timestamp) {
      revert DealExpired(serviceId, expiry);
    }
    dealStorage.provider = provider;
    dealStorage.timestamp = block.timestamp;
    AssetLike assetInstance = AssetLike(asset);
    if (permit.owner != address(0)) {
      assetInstance.join(msg.sender, providers[provider], value, permit);
    } else {
      assetInstance.join(msg.sender, providers[provider], value);
    }
    address assetAddress = assetInstance.asset();
    dealStorage.asset = assetAddress;
    dealStorage.value = value;
    dealStorage.state = State.PAID;
    emit Deal(provider, serviceId);
  }

  function deal(
    bytes32 provider,
    bytes32 serviceId,
    uint256 expiry,
    address asset,
    uint256 value
  ) external onlyLive {
    _deal(provider, serviceId, expiry, asset, value, Permit.EIP2612Permit(address(0), 0, 0, bytes32(0), bytes32(0)));
  }

  function deal(
    bytes32 provider,
    bytes32 serviceId,
    uint256 expiry,
    address asset,
    uint256 value,
    Permit.EIP2612Permit calldata permit
  ) external onlyLive {
    _deal(provider, serviceId, expiry, asset, value, permit);
  }
}
