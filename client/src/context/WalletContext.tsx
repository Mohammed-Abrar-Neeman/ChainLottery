import React, { ReactNode } from 'react';
import { wagmiAdapter, projectId, networks } from '@/config';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { cookieToInitialState } from 'wagmi';
import { useAccount, useDisconnect } from 'wagmi';

// Set up queryClient
const queryClient = new QueryClient();

if (!projectId) {
  throw new Error('Project ID is not defined');
}

// Set up metadata
const metadata = {
  name: 'Chain-Lotto',
  description: 'Chain-Lotto',
  url: 'https://github.com/0xonerb/next-reown-appkit-ssr', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
};

// Create the modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  metadata,
  themeMode: 'light',
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  },
  themeVariables: {
    '--w3m-accent': '#000000',
  }
});

interface WalletProviderProps {
  children: ReactNode;
  cookies: string | null;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children, cookies }) => {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig, cookies);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

export const useWalletContext = () => {
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();

  return {
    isConnected,
    account: address,
    chainId: chainId?.toString() || null,
    disconnect,
    isWrongNetwork: chainId !== 11155111
  };
};
