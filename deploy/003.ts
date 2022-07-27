import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { network } from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (!['gnosis', 'polygon'].includes(network.name)) {
    return;
  }

  const { deployments, getNamedAccounts } = hre;
  const { deploy, execute } = deployments;
};

export default func;
func.tags = ['production'];
