// Network configurations with contract addresses
export const NETWORKS = {
  ethereum: {
    mainnet: {
      rpc: process.env.NEXT_PUBLIC_ETH_MAINNET_RPC || "https://eth-mainnet.public.blastapi.io",
      chainId: 1,
      name: "Ethereum Mainnet",
      lotteryContract: "" // Add when deploying to mainnet
    },
    sepolia: {
      rpc: process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC || "https://ethereum-sepolia.publicnode.com",
      chainId: 11155111,
      name: "Sepolia Testnet",
      lotteryContract: "0x204f5777A911090572633De22b2571d6Bb89308d"
    },
    goerli: {
      rpc: process.env.NEXT_PUBLIC_ETH_GOERLI_RPC || "https://eth-goerli.public.blastapi.io",
      chainId: 5,
      name: "Goerli Testnet",
      lotteryContract: ""
    }
  },
  bsc: {
    mainnet: {
      rpc: process.env.NEXT_PUBLIC_BSC_MAINNET_RPC || "https://bsc-dataseed.binance.org",
      chainId: 56,
      name: "BSC Mainnet",
      lotteryContract: ""
    },
    testnet: {
      rpc: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      name: "BSC Testnet",
      lotteryContract: "0x4D3789B756E80A72AC2d5574CE67565C6435E8Ae"
    }
  },
  polygon: {
    mainnet: {
      rpc: process.env.NEXT_PUBLIC_POLYGON_MAINNET_RPC || "https://polygon-rpc.com",
      chainId: 137,
      name: "Polygon Mainnet",
      lotteryContract: "0x05E865DE0375463d447caeEd6DF713b6F282A41d"
    }
  },
  local: {
    hardhat: {
      rpc: "http://localhost:8545",
      chainId: 1337,
      name: "Local Development",
      lotteryContract: "0x80f6cad7adb5e8b5808d2d978c0d23d2a3787126"
    }
  }
} as const;

// Default network to use
export const DEFAULT_NETWORK = NETWORKS.polygon.mainnet;

// Get the currently active chain ID
export const getActiveChainId = (): string => {
  return DEFAULT_NETWORK.chainId.toString();
};

// Get the lottery contract address for a specific chain
export const getLotteryAddress = (chainId: string = getActiveChainId()): string => {
  try {
    // Find the network configuration that matches the chainId
    const network = Object.values(NETWORKS).flatMap(networkGroup => 
      Object.values(networkGroup)
    ).find(network => network.chainId.toString() === chainId);

    if (!network) {
      console.warn(`No network configuration found for chain ID ${chainId}, falling back to default network`);
      return DEFAULT_NETWORK.lotteryContract;
    }

    return network.lotteryContract;
  } catch (error) {
    console.warn(`Error getting lottery address for chain ${chainId}, falling back to default network:`, error);
    return DEFAULT_NETWORK.lotteryContract;
  }
};

// Network IDs for reference
export const CHAIN_IDS = {
  MAINNET: '1',
  SEPOLIA: '11155111',
  GOERLI: '5',
  LOCAL: '1337',
  BSC_TESTNET: '97',
  BSC_MAINNET: '56',
  POLYGON_MAINNET: '137'
} as const; 