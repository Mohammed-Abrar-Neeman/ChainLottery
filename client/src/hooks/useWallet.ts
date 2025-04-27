import { ethers } from 'ethers';
import { ProviderType } from '@/lib/web3';
import { useWalletContext } from '@/context/WalletContext';

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
  // Use the wallet context instead of managing state directly
  const walletContext = useWalletContext();
  
  return walletContext;
}

// Export useWallet as useWeb3 as an alias for backward compatibility
// Renamed alias for backward compatibility with useLotteryData.js
export const useWeb3 = useWallet;
