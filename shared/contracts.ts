
// Contract addresses for different networks
interface NetworkContracts {
  lottery: string;
}

interface ContractAddresses {
  [key: string]: NetworkContracts;
}

// ACTIVE NETWORK CONFIG - Use these constants across the application
export const ACTIVE_LOTTERY_CONTRACT_ADDRESS = '0xc208cdb7e43a9e27ff293fa0ff8c98170bfebd92';
export const ACTIVE_CHAIN_ID = '11155111'; // Sepolia testnet

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
    lottery: ACTIVE_LOTTERY_CONTRACT_ADDRESS
  },
  [CHAIN_IDS.SEPOLIA]: {
    lottery: ACTIVE_LOTTERY_CONTRACT_ADDRESS
  },
  [CHAIN_IDS.GOERLI]: {
    lottery: ACTIVE_LOTTERY_CONTRACT_ADDRESS
  },
  [CHAIN_IDS.LOCAL]: {
    lottery: ACTIVE_LOTTERY_CONTRACT_ADDRESS
  }
};

// Get the currently active chain ID
export const getActiveChainId = (): string => {
  return ACTIVE_CHAIN_ID;
};

// Get the lottery address for a specific chain
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
