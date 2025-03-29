// Contract addresses for different networks
interface NetworkContracts {
  lottery: string;
}

interface ContractAddresses {
  [key: string]: NetworkContracts;
}

export const contractAddresses: ContractAddresses = {
  // Ethereum Mainnet
  '1': {
    lottery: '0x83434534743bDCcf9Ad139160041fe7818B83b5e'
  },
  // Sepolia Testnet
  '11155111': {
    lottery: '0x83434534743bDCcf9Ad139160041fe7818B83b5e'
  },
  // Goerli Testnet 
  '5': {
    lottery: '0x83434534743bDCcf9Ad139160041fe7818B83b5e'
  },
  // Local development
  '1337': {
    lottery: '0x83434534743bDCcf9Ad139160041fe7818B83b5e'
  }
};

export const getLotteryAddress = (chainId: string): string => {
  const networkContracts = contractAddresses[chainId];
  if (!networkContracts) {
    throw new Error(`No contract addresses found for chain ID: ${chainId}`);
  }
  return networkContracts.lottery;
};
