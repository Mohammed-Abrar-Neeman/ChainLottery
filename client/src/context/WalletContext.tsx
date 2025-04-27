import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { 
  connectWallet, 
  getEthereum, 
  getAccounts, 
  createProvider, 
  ProviderType, 
  switchNetwork as switchWeb3Network 
} from '@/lib/web3';
import { DEFAULT_CHAIN_ID } from '@shared/contracts';
import { useToast } from '@/hooks/use-toast';

// Define the wallet context interface
interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  chainId: string | null;
  provider: ethers.BrowserProvider | null;
  connect: (providerType: ProviderType) => Promise<boolean>;
  disconnect: () => void;
  switchNetwork: (chainId: string) => Promise<boolean>;
}

// Create the context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Provider component
interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Initial check for existing connection
  useEffect(() => {
    const checkExistingConnection = async () => {
      const ethereum = getEthereum();
      if (!ethereum) return;

      try {
        // Create provider
        const newProvider = createProvider(ethereum);
        if (!newProvider) return;
          
        // Check if already connected
        const accounts = await getAccounts(newProvider);
        
        if (accounts.length > 0) {
          console.log('Found existing wallet connection:', accounts[0]);
          
          setProvider(newProvider);
          setAccount(accounts[0]);
          
          // Get chain ID
          const network = await newProvider.getNetwork();
          setChainId(network.chainId.toString());
        }
      } catch (error) {
        console.error('Error checking existing connection:', error);
      }
    };

    checkExistingConnection();
  }, []);

  // Set up event listeners when provider is available
  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      console.log('Accounts changed:', accounts);
      
      if (accounts.length === 0) {
        // User disconnected their wallet
        setAccount(null);
        setProvider(null);
        setChainId(null);
        return;
      }
      
      setAccount(accounts[0]);
    };
    
    const handleChainChanged = (chainIdHex: string) => {
      console.log('Chain changed:', chainIdHex);
      // Convert chainId from hex to decimal
      const newChainId = parseInt(chainIdHex).toString();
      setChainId(newChainId);
      
      // Update provider
      const newProvider = createProvider(ethereum);
      if (newProvider) {
        setProvider(newProvider);
      }
    };
    
    const handleDisconnect = (error: { code: number; message: string }) => {
      console.log('Wallet disconnected', error);
      setAccount(null);
      setProvider(null);
      setChainId(null);
    };
    
    // Subscribe to events
    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);
    ethereum.on('disconnect', handleDisconnect);
    
    // Cleanup
    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
        ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  // Connect wallet
  const connect = async (providerType: ProviderType): Promise<boolean> => {
    setIsConnecting(true);
    
    try {
      const { provider: newProvider, accounts, chainId: newChainId } = await connectWallet(providerType);
      
      if (newProvider && accounts.length > 0) {
        setProvider(newProvider);
        setAccount(accounts[0]);
        setChainId(newChainId);
        
        // Check if the connected chain is the active chain
        if (newChainId && newChainId !== DEFAULT_CHAIN_ID) {
          toast({
            title: 'Wrong Network',
            description: `Please switch to the correct network (Chain ID: ${DEFAULT_CHAIN_ID}).`,
            variant: 'destructive'
          });

          // Auto-switch to the correct network
          await switchNetwork(DEFAULT_CHAIN_ID);
        }
        
        setIsConnecting(false);
        return true;
      }
      
      setIsConnecting(false);
      return false;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setIsConnecting(false);
      return false;
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setProvider(null);
    setAccount(null);
    setChainId(null);
    
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected.',
    });
  };

  // Switch network
  const switchNetwork = async (chainId: string): Promise<boolean> => {
    if (!provider) return false;
    
    try {
      const success = await switchWeb3Network(provider, chainId);
      
      if (success) {
        setChainId(chainId);
        
        // Update provider
        const ethereum = getEthereum();
        if (ethereum) {
          const newProvider = createProvider(ethereum);
          if (newProvider) {
            setProvider(newProvider);
          }
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error switching network:', error);
      return false;
    }
  };

  // Context value
  const contextValue: WalletContextType = {
    isConnected: !!account,
    isConnecting,
    account,
    chainId,
    provider,
    connect,
    disconnect,
    switchNetwork
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook to use the wallet context
export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};