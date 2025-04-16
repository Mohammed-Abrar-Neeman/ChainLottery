import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { connectWallet, getEthereum, getAccounts, createProvider, ProviderType, switchNetwork as switchWeb3Network } from '@/lib/web3';
import { ACTIVE_CHAIN_ID } from '@shared/contracts';

interface UseWalletReturn {
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  chainId: string | null;
  provider: ethers.BrowserProvider | null;
  connect: (providerType: ProviderType) => Promise<boolean>;
  disconnect: () => void;
  switchNetwork: (chainId: string) => Promise<boolean>;
}

export function useWallet(): UseWalletReturn {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Initialize wallet from local storage
  useEffect(() => {
    const init = async () => {
      const ethereum = getEthereum();
      if (!ethereum) return;
      
      const newProvider = createProvider(ethereum);
      if (!newProvider) return;
      
      const accounts = await getAccounts(newProvider);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setProvider(newProvider);
        
        const network = await newProvider.getNetwork();
        const currentChainId = network.chainId.toString();
        setChainId(currentChainId);
        
        // Check if we need to switch to the active chain
        if (currentChainId !== ACTIVE_CHAIN_ID) {
          console.log(`Wallet connected to chainId ${currentChainId}, our app needs ${ACTIVE_CHAIN_ID}`);
          // Don't automatically switch - this could confuse users
          // The UI will show a network switch prompt when needed
        }
      }
    };
    
    init();
  }, []);
  
  // Event listeners for wallet changes
  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;
    
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User has disconnected all accounts
        setAccount(null);
      } else {
        setAccount(accounts[0]);
      }
    };
    
    const handleChainChanged = (chainIdHex: string) => {
      // Convert hex chainId to decimal
      const newChainId = parseInt(chainIdHex, 16).toString();
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
  const connect = useCallback(async (providerType: ProviderType): Promise<boolean> => {
    setIsConnecting(true);
    
    try {
      const { provider: newProvider, accounts, chainId: newChainId } = await connectWallet(providerType);
      
      if (newProvider && accounts.length > 0) {
        setProvider(newProvider);
        setAccount(accounts[0]);
        setChainId(newChainId);
        
        // Check if the connected chain is the active chain
        if (newChainId && newChainId !== ACTIVE_CHAIN_ID) {
          console.log(`Connected to chain ${newChainId}, but active chain is ${ACTIVE_CHAIN_ID}`);
          // We'll let the UI handle prompting for network switch
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
  }, []);
  
  // Disconnect wallet
  const disconnect = useCallback(() => {
    setProvider(null);
    setAccount(null);
    setChainId(null);
  }, []);
  
  // Switch network
  const switchNetwork = useCallback(async (newChainId: string = ACTIVE_CHAIN_ID): Promise<boolean> => {
    if (!provider) return false;
    
    return await switchWeb3Network(provider, newChainId);
  }, [provider]);
  
  return {
    isConnected: !!account,
    isConnecting,
    account,
    chainId,
    provider,
    connect,
    disconnect,
    switchNetwork
  };
}

// Export useWallet as useWeb3 as an alias for backward compatibility
// Renamed alias for backward compatibility with useLotteryData.js
export const useWeb3 = useWallet;
