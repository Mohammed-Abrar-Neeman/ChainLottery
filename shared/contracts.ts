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
    lottery: '0x23DB4Dd0fE2961B696bE9c98608A8A0e322F4DaA'
  },
  // Sepolia Testnet
  '11155111': {
    lottery: '0x23DB4Dd0fE2961B696bE9c98608A8A0e322F4DaA'
  },
  // Goerli Testnet 
  '5': {
    lottery: '0x23DB4Dd0fE2961B696bE9c98608A8A0e322F4DaA'
  },
  // Local development
  '1337': {
    lottery: '0x23DB4Dd0fE2961B696bE9c98608A8A0e322F4DaA'
  }
};

export const getLotteryAddress = (chainId: string): string => {
  const networkContracts = contractAddresses[chainId];
  if (!networkContracts) {
    throw new Error(`No contract addresses found for chain ID: ${chainId}`);
  }
  return networkContracts.lottery;
};
