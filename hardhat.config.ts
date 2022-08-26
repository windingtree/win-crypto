import { HardhatUserConfig } from 'hardhat/types';

import '@openzeppelin/hardhat-upgrades';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-solhint';
import '@typechain/hardhat';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import 'hardhat-docgen';
import { nodeUrl, accounts } from './utils/network';

import 'dotenv/config';

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.13',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  namedAccounts: {
    deployer: 0,
    alice: 1,
    bob: 2,
    carol: 3
  },
  networks: {
    hardhat: {
      // process.env.HARDHAT_FORK will specify the network that the fork is made from.
      // this line ensure the use of the corresponding accounts
      accounts: accounts(process.env.HARDHAT_FORK),
      hardfork: 'london',
      // gasPrice: 11000000000,
      forking: process.env.HARDHAT_FORK
        ? {
            // TODO once PR merged : network: process.env.HARDHAT_FORK,
            url: nodeUrl(process.env.HARDHAT_FORK),
            blockNumber: process.env.HARDHAT_FORK_NUMBER ? parseInt(process.env.HARDHAT_FORK_NUMBER) : undefined
          }
        : undefined,
      saveDeployments: false,
      tags: ['local', 'forked']
    },
    ganache: {
      url: 'http://127.0.0.1:7545/',
      saveDeployments: true,
      tags: ['local']
    },
    localhost: {
      url: nodeUrl('localhost'),
      accounts: accounts(),
      saveDeployments: true,
      tags: ['local']
    },
    sokol: {
      url: nodeUrl('sokol'),
      accounts: accounts('sokol'),
      tags: ['staging'],
      gasPrice: 50000000000
    },
    polygon_mumbai: {
      url: nodeUrl('polygon_mumbai'),
      accounts: accounts('polygon_mumbai'),
      tags: ['staging']
    },
    gnosis: {
      url: nodeUrl('gnosis'),
      accounts: accounts('gnosis'),
      tags: ['production']
    },
    polygon: {
      url: nodeUrl('polygon'),
      accounts: accounts('polygon'),
      tags: ['production']
    }
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 100,
    enabled: !!process.env.REPORT_GAS,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    maxMethodDiff: 10
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5'
  },
  mocha: {
    timeout: 0
  },
  docgen: {
    path: './docs',
    clear: true,
    runOnCompile: true
  },
  verify: {
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY
    }
  }
};

export default config;
