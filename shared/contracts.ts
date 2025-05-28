
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
export const DEFAULT_CHAIN_ID = '97'; // Sepolia testnet

// For backwards compatibility - keep ACTIVE_CHAIN_ID as an alias to DEFAULT_CHAIN_ID
export const ACTIVE_CHAIN_ID = DEFAULT_CHAIN_ID;

// Contract addresses for each network
export const LOTTERY_CONTRACT_ADDRESSES: {[chainId: string]: string} = {
  '1': '',                                                   // Ethereum Mainnet (add address when deploying to mainnet)
  '11155111': '0x204f5777A911090572633De22b2571d6Bb89308d', // Sepolia Testnet (current development network)
  '5': '',                                                   // Goerli Testnet
  '1337': '0x80f6cad7adb5e8b5808d2d978c0d23d2a3787126',     // Local development
  '97': '0x6745689775ECd4f761839bE7d179e6980C577aC7'         // BSC Testnet
};

// Current active lottery contract address based on the default chain
export const ACTIVE_LOTTERY_CONTRACT_ADDRESS = LOTTERY_CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID];

// Network options (for reference)
export const CHAIN_IDS = {
  MAINNET: '1',
  SEPOLIA: '11155111',
  GOERLI: '5',
  LOCAL: '1337',
  BSC_TESTNET: '97'
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
  },
  [CHAIN_IDS.BSC_TESTNET]: {
    lottery: LOTTERY_CONTRACT_ADDRESSES[CHAIN_IDS.BSC_TESTNET]
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
