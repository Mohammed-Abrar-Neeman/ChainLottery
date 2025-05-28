export const NETWORKS = {
  ethereum: {
    sepolia: {
      rpc: process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC || "https://ethereum-sepolia.publicnode.com",
      chainId: 11155111,
      name: "Sepolia Testnet"
    }
  },
  bsc: {
    testnet: {
      rpc: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      name: "BSC Testnet"
    }
  }
} as const;

// Default network to use
export const DEFAULT_NETWORK = NETWORKS.bsc.testnet; 