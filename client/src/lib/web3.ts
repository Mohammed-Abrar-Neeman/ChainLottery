import { ethers } from 'ethers';
import { toast } from '@/hooks/use-toast';
import { CHAIN_IDS, DEFAULT_CHAIN_ID } from '@shared/contracts';

// Types
export interface Web3Provider {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  chainId: string | null;
  accounts: string[];
  connect: (providerType: ProviderType) => Promise<boolean>;
  disconnect: () => void;
  getBalance: (address: string) => Promise<string>;
  switchNetwork: (chainId: string) => Promise<boolean>;
}

export type ProviderType = 'metamask' | 'walletconnect' | 'coinbase';

// Initialize ethereum from window
export const getEthereum = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return window.ethereum;
  }
  return null;
};

// Create ethers provider from ethereum object
export const createProvider = (ethereum: any): ethers.BrowserProvider | null => {
  if (!ethereum) return null;
  return new ethers.BrowserProvider(ethereum, 'any');
};

// Get connected accounts
export const getAccounts = async (provider: ethers.BrowserProvider | null): Promise<string[]> => {
  if (!provider) return [];
  try {
    const accounts = await provider.listAccounts();
    return accounts.map(account => account.address);
  } catch (error) {
    return [];
  }
};

// Connect to wallet
export const connectWallet = async (providerType: ProviderType): Promise<{
  provider: ethers.BrowserProvider | null;
  accounts: string[];
  chainId: string | null;
}> => {
  try {
    // For now we just support metamask
    // In a full implementation, we would add support for WalletConnect and Coinbase Wallet
    if (providerType !== 'metamask') {
      toast({
        title: "Provider not supported",
        description: "Currently only MetaMask is supported. Please install MetaMask to continue.",
        variant: "destructive"
      });
      return { provider: null, accounts: [], chainId: null };
    }
    
    const ethereum = getEthereum();
    
    if (!ethereum) {
      toast({
        title: "MetaMask not detected",
        description: "Please install MetaMask to use this feature.",
        variant: "destructive"
      });
      
      // Open in new tab
      window.open('https://metamask.io/download.html', '_blank');
      return { provider: null, accounts: [], chainId: null };
    }
    
    const provider = createProvider(ethereum);
    if (!provider) {
      throw new Error('Failed to create provider');
    }
    
    // Request accounts
    await ethereum.request({ method: 'eth_requestAccounts' });
    const accounts = await provider.listAccounts();
    const accountAddresses = accounts.map(account => account.address);
    
    const network = await provider.getNetwork();
    const chainId = network.chainId.toString();
    
    return { provider, accounts: accountAddresses, chainId };
  } catch (error) {
    let errorMessage = "Failed to connect to wallet";
    
    if (error instanceof Error) {
      // Handle user rejected request
      if (error.message.includes('User rejected')) {
        errorMessage = "Connection rejected. Please approve the connection in your wallet.";
      }
    }
    
    toast({
      title: "Connection Error",
      description: errorMessage,
      variant: "destructive"
    });
    
    return { provider: null, accounts: [], chainId: null };
  }
};

// Get ETH balance
export const getBalance = async (
  provider: ethers.BrowserProvider | null,
  address: string
): Promise<string> => {
  if (!provider || !address) return '0';
  
  try {
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    return '0';
  }
};

// Format a blockchain address for display
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Convert wei to ether string with format
export const formatEther = (wei: string | number): string => {
  try {
    return parseFloat(ethers.formatEther(wei.toString())).toFixed(4);
  } catch (error) {
    return '0';
  }
};

// Convert ether to wei
export const parseEther = (ether: string): string => {
  try {
    return ethers.parseEther(ether).toString();
  } catch (error) {
    return '0';
  }
};

// Add a network to the wallet
const addNetwork = async (chainId: string): Promise<void> => {
  // Network parameters for common chains
  const networks: Record<string, any> = {
    [CHAIN_IDS.MAINNET]: {
      chainId: '0x1',
      chainName: 'Ethereum Mainnet',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://mainnet.infura.io/v3/'],
      blockExplorerUrls: ['https://etherscan.io']
    },
    [CHAIN_IDS.SEPOLIA]: {
      chainId: '0xaa36a7',
      chainName: 'Sepolia Testnet',
      nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://sepolia.infura.io/v3/'],
      blockExplorerUrls: ['https://sepolia.etherscan.io']
    },
    [CHAIN_IDS.GOERLI]: {
      chainId: '0x5',
      chainName: 'Goerli Testnet',
      nativeCurrency: { name: 'Goerli Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://goerli.infura.io/v3/'],
      blockExplorerUrls: ['https://goerli.etherscan.io']
    }
  };
  
  const params = networks[chainId];
  if (!params) {
    throw new Error(`Network parameters not found for chain ID: ${chainId}`);
  }
  
  if (window.ethereum && window.ethereum.request) {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [params]
    });
  } else {
    throw new Error('Ethereum provider not available');
  }
};

// Switch to a specific network chain
export const switchNetwork = async (
  provider: ethers.BrowserProvider | null,
  chainId: string = DEFAULT_CHAIN_ID
): Promise<boolean> => {
  if (!provider) return false;
  
  try {
    // Get current network
    const network = await provider.getNetwork();
    const currentChainId = network.chainId.toString();
    
    // If already on correct network, return true
    if (currentChainId === chainId) {
      return true;
    }
    
    const hexChainId = `0x${parseInt(chainId).toString(16)}`;
  
    try {
      if (window.ethereum && window.ethereum.request) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexChainId }]
        });
        return true;
      }
      return false;
    } catch (error: any) {
      // If the chain hasn't been added to MetaMask
      if (error.code === 4902) {
        try {
          // Add the chain
          await addNetwork(chainId);
          return true;
        } catch (addError) {
          toast({
            title: "Network Error",
            description: "Failed to add network. Please add it manually in your wallet.",
            variant: "destructive"
          });
          return false;
        }
      } else {
        toast({
          title: "Network Error",
          description: "Failed to switch network. Please try again.",
          variant: "destructive"
        });
        return false;
      }
    }
  } catch (outerError) {
    toast({
      title: "Network Error",
      description: "An unexpected error occurred. Please try again.",
      variant: "destructive"
    });
    return false;
  }
};
