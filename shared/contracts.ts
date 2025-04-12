// Contract addresses for different networks
interface NetworkContracts {
  lottery: string;
}

interface ContractAddresses {
  [key: string]: NetworkContracts;
}

// ACTIVE NETWORK CONFIG - Use these constants across the application
// When you want to update the contract or network, just change these values
export const ACTIVE_LOTTERY_CONTRACT_ADDRESS = '0x2665ff6459dab4792e163724bf26af246384eeae';
export const ACTIVE_CHAIN_ID = '11155111'; // Sepolia testnet

// Network options (for reference)
export const CHAIN_IDS = {
  MAINNET: '1',
  SEPOLIA: '11155111',
  GOERLI: '5',
  LOCAL: '1337'
};

// Network-specific contracts (all pointing to the same address for convenience)
export const contractAddresses: ContractAddresses = {
  // Ethereum Mainnet
  [CHAIN_IDS.MAINNET]: {
    lottery: ACTIVE_LOTTERY_CONTRACT_ADDRESS
  },
  // Sepolia Testnet
  [CHAIN_IDS.SEPOLIA]: {
    lottery: ACTIVE_LOTTERY_CONTRACT_ADDRESS
  },
  // Goerli Testnet 
  [CHAIN_IDS.GOERLI]: {
    lottery: ACTIVE_LOTTERY_CONTRACT_ADDRESS
  },
  // Local development
  [CHAIN_IDS.LOCAL]: {
    lottery: ACTIVE_LOTTERY_CONTRACT_ADDRESS
  }
};

// Get the currently active chain ID
export const getActiveChainId = (): string => {
  return ACTIVE_CHAIN_ID;
};

// Get the lottery address for a specific chain - always returns the active contract
export const getLotteryAddress = (chainId: string = ACTIVE_CHAIN_ID): string => {
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
