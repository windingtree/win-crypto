import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { MockERC20, MockWrappedERC20 } from '../typechain';
import { ethers, network } from 'hardhat';
import { utils } from 'ethers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (!['polygon_mumbai'].includes(network.name)) {
    return;
  }
};

export default func;
func.tags = ['sokol', 'staging'];
