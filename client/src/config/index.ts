import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { base } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'



// Get projectId from https://cloud.reown.com

// TODO: Replace with environment variable once .env.local is working
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'bc92d98ba3be558059c45443385417a3';

if (!projectId) {
  throw new Error('Project ID is not defined');
}

export const networks = [base] as [AppKitNetwork, ...AppKitNetwork[]]

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