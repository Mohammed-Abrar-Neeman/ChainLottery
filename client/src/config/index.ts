import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { bscTestnet } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// Debug environment variables
console.log('Environment variables:', {
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  lotteryContractAddress: process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS
});

// Get projectId from https://cloud.reown.com
// Temporarily hardcoded for development
//export const projectId = 'b56e18d47c72ab683b10814fe9495694';

// TODO: Replace with environment variable once .env.local is working
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694';

if (!projectId) {
  console.error('Project ID is not defined');
  throw new Error('Project ID is not defined');
}

export const networks = [bscTestnet] as [AppKitNetwork, ...AppKitNetwork[]]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,  
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig

// Contract configuration
export const contractConfig = {
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
  abi: [] // Your contract ABI will go here
}