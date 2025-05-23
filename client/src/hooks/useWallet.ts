import { ethers } from 'ethers';
import { ProviderType } from '@/lib/web3';
import { useAccount, useDisconnect } from 'wagmi';

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
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();

  return {
    isConnected,
    account: address ?? null,
    chainId: chainId ? chainId.toString() : null,
    disconnect,
    isWrongNetwork: chainId !== 11155111,
    isConnecting: false,
    provider: null,
    connect: async () => false,
    switchNetwork: async () => false
  };
}

// Export useWallet as useWeb3 as an alias for backward compatibility
// Renamed alias for backward compatibility with useLotteryData.js
export const useWeb3 = useWallet;
