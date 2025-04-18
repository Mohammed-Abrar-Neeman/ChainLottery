
// Contract addresses for different networks
interface NetworkContracts {
  lottery: string;
}

interface ContractAddresses {
  [key: string]: NetworkContracts;
}

/**
 * PRODUCTION CONFIGURATION
 * 
 * To change the contract addresses for deployment:
 * 1. Update the LOTTERY_CONTRACT_ADDRESSES object with your contract addresses
 * 2. Set the DEFAULT_CHAIN_ID to your target network
 */

// Default chain ID to use across the application
export const DEFAULT_CHAIN_ID = '11155111'; // Sepolia testnet

// For backwards compatibility - keep ACTIVE_CHAIN_ID as an alias to DEFAULT_CHAIN_ID
export const ACTIVE_CHAIN_ID = DEFAULT_CHAIN_ID;

// Contract addresses for each network
export const LOTTERY_CONTRACT_ADDRESSES: {[chainId: string]: string} = {
  '1': '',                                                   // Ethereum Mainnet (add address when deploying to mainnet)
  '11155111': '0xc208cdb7e43a9e27ff293fa0ff8c98170bfebd92', // Sepolia Testnet (current development network)
  '5': '',                                                   // Goerli Testnet
  '1337': '0xc208cdb7e43a9e27ff293fa0ff8c98170bfebd92'      // Local development
};

// Current active lottery contract address based on the default chain
export const ACTIVE_LOTTERY_CONTRACT_ADDRESS = LOTTERY_CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID];

// Network options (for reference)
export const CHAIN_IDS = {
  MAINNET: '1',
  SEPOLIA: '11155111',
  GOERLI: '5',
  LOCAL: '1337'
};

// Network-specific contracts
export const contractAddresses: ContractAddresses = {
  [CHAIN_IDS.MAINNET]: {
    lottery: LOTTERY_CONTRACT_ADDRESSES[CHAIN_IDS.MAINNET]
  },
  [CHAIN_IDS.SEPOLIA]: {
    lottery: LOTTERY_CONTRACT_ADDRESSES[CHAIN_IDS.SEPOLIA]
  },
  [CHAIN_IDS.GOERLI]: {
    lottery: LOTTERY_CONTRACT_ADDRESSES[CHAIN_IDS.GOERLI]
  },
  [CHAIN_IDS.LOCAL]: {
    lottery: LOTTERY_CONTRACT_ADDRESSES[CHAIN_IDS.LOCAL]
  }
};

// Get the currently active chain ID
export const getActiveChainId = (): string => {
  return DEFAULT_CHAIN_ID;
};

// Get the lottery address for a specific chain
export const getLotteryAddress = (chainId: string = DEFAULT_CHAIN_ID): string => {
  try {
    const networkContracts = contractAddresses[chainId];
    if (!networkContracts) {
      console.warn(`No contract addresses defined for chain ID ${chainId}, falling back to active address`);
      return ACTIVE_LOTTERY_CONTRACT_ADDRESS;
    }
    return networkContracts.lottery;
  } catch (error) {
    console.warn(`Error getting lottery address for chain ${chainId}, falling back to active address:`, error);
    return ACTIVE_LOTTERY_CONTRACT_ADDRESS;
  }
};
