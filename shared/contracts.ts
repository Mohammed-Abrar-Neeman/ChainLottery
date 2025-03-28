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
    lottery: '0x7C9e73d4C71dae564d41F78d56439bB4ba87592B'
  },
  // Sepolia Testnet
  '11155111': {
    lottery: '0x7C9e73d4C71dae564d41F78d56439bB4ba87592B'
  },
  // Goerli Testnet 
  '5': {
    lottery: '0x7C9e73d4C71dae564d41F78d56439bB4ba87592B'
  },
  // Local development
  '1337': {
    lottery: '0x7C9e73d4C71dae564d41F78d56439bB4ba87592B'
  }
};

export const getLotteryAddress = (chainId: string): string => {
  const networkContracts = contractAddresses[chainId];
  if (!networkContracts) {
    throw new Error(`No contract addresses found for chain ID: ${chainId}`);
  }
  return networkContracts.lottery;
};
