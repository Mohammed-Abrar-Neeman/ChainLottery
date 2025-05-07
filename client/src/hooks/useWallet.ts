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
  isWrongNetwork: boolean;
}

export function useWallet(): UseWalletReturn {
  const context = useWalletContext();
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context as UseWalletReturn;
}

// Export useWallet as useWeb3 as an alias for backward compatibility
// Renamed alias for backward compatibility with useLotteryData.js
export const useWeb3 = useWallet;
