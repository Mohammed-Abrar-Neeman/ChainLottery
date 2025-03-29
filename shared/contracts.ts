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
    lottery: '0xFEa5cF2172a8701E8715069263e95c74eAcb4817'
  },
  // Sepolia Testnet
  '11155111': {
    lottery: '0xFEa5cF2172a8701E8715069263e95c74eAcb4817'
  },
  // Goerli Testnet 
  '5': {
    lottery: '0xFEa5cF2172a8701E8715069263e95c74eAcb4817'
  },
  // Local development
  '1337': {
    lottery: '0xFEa5cF2172a8701E8715069263e95c74eAcb4817'
  }
};

export const getLotteryAddress = (chainId: string): string => {
  const networkContracts = contractAddresses[chainId];
  if (!networkContracts) {
    throw new Error(`No contract addresses found for chain ID: ${chainId}`);
  }
  return networkContracts.lottery;
};
