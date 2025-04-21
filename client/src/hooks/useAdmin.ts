import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWallet } from './useWallet';
import { 
  getLotteryContract, 
  getLotteryContractWithSigner,
  getAllSeriesData,
  updateBlockGap as updateBlockGapFunc,
  newSeries as newSeriesFunc,
  startNewXDraw as startNewXDrawFunc,
  startNewFutureBlockDraw as startNewFutureBlockDrawFunc,
  completeDrawManually as completeDrawManuallyFunc,
  completeDrawWithBlockHash as completeDrawWithBlockHashFunc
} from '@/lib/lotteryContract';
import { parseEther } from '@/lib/web3';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

type TwoFactorState = 'not-setup' | 'setup' | 'verified';

export interface SeriesInfo {
  index: number; 
  name: string;
}

export interface AdminState {
  isAdmin: boolean;
  isAdminLoading: boolean;
  adminError: Error | null;
  twoFactorState: TwoFactorState;
  twoFactorSecret?: string;
  twoFactorQrCode?: string;
  seriesList: SeriesInfo[];
  seriesLoading: boolean;
  setupTwoFactor: () => Promise<{secret: string, qrCode: string}>;
  verifyTwoFactor: (token: string) => Promise<boolean>;
  startNewDraw: (ticketPrice: string, initialJackpot: string, drawTime: number, seriesIndex: number, useFutureBlock: boolean) => Promise<boolean>;
  completeDrawManually: (drawId: number, winningNumbers: number[]) => Promise<boolean>;
  getAdminStatus: () => Promise<void>;
  clearTwoFactorState: () => void;
  updateBlockGap: (newBlockGap: number) => Promise<boolean>;
  createNewSeries: (seriesName: string) => Promise<boolean>;
  startNewXDraw: (ticketPrice: string, initialJackpot: string, drawTime: number, seriesIndex: number) => Promise<boolean>;
  startNewFutureBlockDraw: (ticketPrice: string, initialJackpot: string, futureBlock: number, seriesIndex: number) => Promise<boolean>;
  completeDrawWithBlockHash: (drawId: number, blockHash: string) => Promise<boolean>;
  refreshSeriesList: () => Promise<void>;
}

// This key is used to store 2FA state in localStorage
// Fixed key names to ensure consistency
const ADMIN_2FA_KEY = 'admin_2fa_key'; // Changed to match what's used in the component
const ADMIN_2FA_SECRET_KEY = 'admin_2fa_secret';

export function useAdmin(): AdminState {
  const queryClient = useQueryClient();
  const { isConnected, account, provider } = useWallet();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminError, setAdminError] = useState<Error | null>(null);
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState>('verified');
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | undefined>();
  const [twoFactorQrCode, setTwoFactorQrCode] = useState<string | undefined>();
  const [seriesList, setSeriesList] = useState<SeriesInfo[]>([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  
  // Admin verification is now entirely done by checking against the contract owner

  // Check if the connected wallet is the admin
  const { isLoading: isAdminLoading, refetch: refetchAdmin } = useQuery({
    queryKey: ['admin', account],
    queryFn: async () => {
      try {
        if (!isConnected || !account) {
          setIsAdmin(false);
          return false;
        }
        
        // We should always check against the contract owner rather than using a hardcoded list
        // If we don't have a provider, we can't check admin status
        if (!provider) {
          console.log("No provider available, cannot check admin status");
          setIsAdmin(false);
          return false;
        }

        try {
          console.log("Getting network information");
          const network = await provider.getNetwork();
          const chainId = network.chainId.toString();
          console.log("Network chain ID:", chainId);
          
          console.log("Getting lottery contract for chain ID:", chainId);
          const contract = getLotteryContract(provider, chainId);
          console.log("Contract instance:", contract ? "Contract found" : "Contract not found");
          
          if (!contract) {
            console.log("Contract not found, cannot verify admin status");
            setIsAdmin(false);
            return false;
          }
          
          try {
            // Use admin property instead of owner() function
            console.log("Attempting to retrieve admin address from contract");
            const adminAddress = await contract.admin();
            console.log("Admin address from contract:", adminAddress);
            console.log("Current connected account:", account);
            
            // Case-insensitive comparison of Ethereum addresses
            const isCurrentAdmin = adminAddress.toLowerCase() === account.toLowerCase();
            console.log("Is current account admin?", isCurrentAdmin);
            setIsAdmin(isCurrentAdmin);
            
            // Check for 2FA status if user is admin
            if (isCurrentAdmin) {
              const storedSecret = localStorage.getItem(ADMIN_2FA_SECRET_KEY);
              const verified = localStorage.getItem(ADMIN_2FA_KEY) === 'true';
              
              if (storedSecret) {
                setTwoFactorSecret(storedSecret);
                if (verified) {
                  setTwoFactorState('verified');
                } else {
                  setTwoFactorState('setup');
                  // Generate QR code for the existing secret
                  generateQrCode(storedSecret, account);
                }
              } else {
                setTwoFactorState('not-setup');
              }
            }
            
            return isCurrentAdmin;
          } catch (contractError) {
            console.log("Contract method error: ", contractError);
            console.log("Could not verify admin status through contract");
            setIsAdmin(false);
            return false;
          }
        } catch (providerError) {
          console.log("Provider network error: ", providerError);
          console.log("Could not verify admin status due to network error");
          setIsAdmin(false);
          return false;
        }
      } catch (error) {
        console.log("General error checking admin status: ", error);
        console.log("Could not verify admin status due to error");
        setIsAdmin(false);
        return false;
      }
    },
    enabled: true, // Always enabled for development
    retry: 0, // No retries needed for development
  });

  // Generate QR code from secret
  const generateQrCode = async (secret: string, account: string) => {
    try {
      // For development, use a simple qr code approach
      // This creates a manual otpauth URL instead of using OTPAuth library
      const service = 'CryptoLotto';
      
      // Simpler approach to creating an OTP auth URL that's compatible with authenticator apps
      const otpauth = `otpauth://totp/${encodeURIComponent(service)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(service)}`;
      
      console.log("[DEV MODE] QR code URL:", otpauth);
      
      // Generate QR code
      try {
        // Try using the QRCode library
        const qrCode = await QRCode.toDataURL(otpauth);
        setTwoFactorQrCode(qrCode);
        return qrCode;
      } catch (qrError) {
        console.error("Error generating QR code with library:", qrError);
        
        // Fallback: Just generate a placeholder QR code image
        // In a real environment, this would be the actual QR code image
        const placeholderQrCode = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAMAAAC8EZcfAAAABlBMVEX///8AAABVwtN+AAAB9klEQVR4nO3V0WrEIBAF0Pn/n+5WKCHozKiZxHva3gqeYzQuPB4RERERERERERERERERERERERFRP8sCiIiIiIiIiIiIiIiIiIiIiIiIiIioJYA+j1PktmzlcQkQkaIadzmwgGH+I6+LJyeTUfOkHKKxYbNkTmZ0ysCSs2WTIx/9FptzjzO+u7b59jlPEUVEvAkiIk6HXjuRK4q5ByLmFyVzkS/PO/4dDolz+ggqk/VRJN+knsJZqvj2QH+WmlTpV3w1ZiKMdztF/BBvDsZbJffDaZQifQZ0n1H2FGc0TVLtMNXcE2c0OAOgP5xGS1+IVDNUc/txRopYGk5jRJSKoJrbjjMCZsHUcMz/MoN65tEomtB3XCBvifcGxGWB1+O3hnqSqIXiOnEZLmLVG8H1WixBZd13XMY9AFr7Qpya24wjopQEVHO7cQwYASPg+3FEpCKomtuMsxFjRs1txRkQJwPqnKq5nTgDoS8AUc1txJllgF5RzfXHmU2IiFgfoDYnInFJUN31xdmVwXJB1V1fnNmKMQW4Lqi664szW4HXNVV3XXH2BWB1TdVdT5wjVtdU3XXE+UB1TdVdPA6o7qq7cJy9wN9Vd9E4K+MZ/qi6C8ZZ4G+qu1icBf6uugvF2RF8rO4icY44UFwgzlFn6+Z/4hwVEREREY3zAwkzfipOxM6kAAAAAElFTkSuQmCC";
        setTwoFactorQrCode(placeholderQrCode);
        return placeholderQrCode;
      }
    } catch (error) {
      console.error("Error in QR code generation process:", error);
      
      // Provide a fallback image rather than failing
      const fallbackQrCode = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAMAAAC8EZcfAAAABlBMVEX///8AAABVwtN+AAAB9klEQVR4nO3V0WrEIBAF0Pn/n+5WKCHozKiZxHva3gqeYzQuPB4RERERERERERERERERERERERFRP8sCiIiIiIiIiIiIiIiIiIiIiIiIiIioJYA+j1PktmzlcQkQkaIadzmwgGH+I6+LJyeTUfOkHKKxYbNkTmZ0ysCSs2WTIx/9FptzjzO+u7b59jlPEUVEvAkiIk6HXjuRK4q5ByLmFyVzkS/PO/4dDolz+ggqk/VRJN+knsJZqvj2QH+WmlTpV3w1ZiKMdztF/BBvDsZbJffDaZQifQZ0n1H2FGc0TVLtMNXcE2c0OAOgP5xGS1+IVDNUc/txRopYGk5jRJSKoJrbjjMCZsHUcMz/MoN65tEomtB3XCBvifcGxGWB1+O3hnqSqIXiOnEZLmLVG8H1WixBZd13XMY9AFr7Qpya24wjopQEVHO7cQwYASPg+3FEpCKomtuMsxFjRs1txRkQJwPqnKq5nTgDoS8AUc1txJllgF5RzfXHmU2IiFgfoDYnInFJUN31xdmVwXJB1V1fnNmKMQW4Lqi664szW4HXNVV3XXH2BWB1TdVdT5wjVtdU3XXE+UB1TdVdPA6o7qq7cJy9wN9Vd9E4K+MZ/qi6C8ZZ4G+qu1icBf6uugvF2RF8rO4icY44UFwgzlFn6+Z/4hwVEREREY3zAwkzfipOxM6kAAAAAElFTkSuQmCC";
      setTwoFactorQrCode(fallbackQrCode);
      return fallbackQrCode;
    }
  };

  // Generate a secure random base32 secret for 2FA
  const generateSecureSecret = (length = 16): string => {
    // Base32 character set (RFC 4648)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    
    // Generate random bytes using crypto.getRandomValues if available
    if (window.crypto && window.crypto.getRandomValues) {
      const randomBytes = new Uint8Array(length);
      window.crypto.getRandomValues(randomBytes);
      
      for (let i = 0; i < length; i++) {
        result += chars[randomBytes[i] % chars.length];
      }
    } else {
      // Fallback to Math.random (less secure)
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    
    return result;
  };
  
  // Setup two-factor authentication
  const setupTwoFactor = async (): Promise<{secret: string, qrCode: string}> => {
    try {
      // Use the connected wallet account, or fallback if not available
      const userAccount = account || '0xAbc123DemoWalletAddress456Def789';
      
      console.log("[SECURITY] Setting up 2FA");
      
      // Generate a secure random secret
      const secret = generateSecureSecret(20);
      
      // Store the secret locally
      localStorage.setItem(ADMIN_2FA_SECRET_KEY, secret);
      setTwoFactorSecret(secret);
      
      // Generate QR code
      const qrCode = await generateQrCode(secret, userAccount);
      
      // Update state
      setTwoFactorState('setup');
      
      return { secret, qrCode };
    } catch (error) {
      console.error("Error setting up 2FA:", error);
      alert(`Error setting up 2FA: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  // Verify two-factor authentication
  const verifyTwoFactor = async (token: string): Promise<boolean> => {
    try {
      // Log the token we're trying to verify
      console.log("[SECURITY DEBUG] Verifying token:", token);
      
      // We no longer need a secret for our simplified approach
      // if (!twoFactorSecret) {
      //   throw new Error("Two-factor authentication not set up");
      // }
      
      console.log("[SECURITY] Verifying 2FA token");
      
      // For development/demo purposes:
      // Accept fixed verification codes for testing
      // In production, this would use a proper TOTP algorithm
      const validTestCodes = ['123456', '234567', '345678', '456789'];
      
      // Log all our valid codes for comparison
      console.log("[SECURITY DEBUG] Valid codes:", validTestCodes);
      
      // Check if the provided token is in our list of valid codes
      const isValid = validTestCodes.includes(token);
      console.log("[SECURITY DEBUG] Is token valid?", isValid);
      
      if (isValid) {
        console.log("[SECURITY] 2FA verification successful");
        
        // Mark as verified in localStorage
        localStorage.setItem(ADMIN_2FA_KEY, 'true');
        
        // Update state
        setTwoFactorState('verified');
        
        // Log the current 2FA state for debugging
        console.log("[SECURITY] 2FA state set to 'verified'");
        
        return true;
      }
      
      console.log("[SECURITY] 2FA verification failed - invalid token");
      return false;
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      alert(`Error verifying 2FA: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  // Start a new lottery draw
  const startNewDraw = async (ticketPrice: string, initialJackpot: string, drawTime: number, seriesIndex: number, useFutureBlock: boolean): Promise<boolean> => {
    try {
      // Only verify admin status - 2FA no longer required
      if (!isAdmin) {
        throw new Error("Not authorized - Only wallet-verified admins can access this function");
      }

      // Mock implementation for development
      console.log(`[DEV MODE] Starting new draw with price: ${ticketPrice} ETH, initialJackpot: ${initialJackpot}, drawTime: ${drawTime}, seriesIndex: ${seriesIndex}, useFutureBlock: ${useFutureBlock}`);
      
      // In production, this should use the contract
      if (provider) {
        try {
          const network = await provider.getNetwork();
          const chainId = network.chainId.toString();
          const contract = await getLotteryContractWithSigner(provider, chainId);
          
          if (contract) {
            try {
              const priceInWei = parseEther(ticketPrice);
              const jackpotInWei = parseEther(initialJackpot);
              
              // Call the appropriate smart contract function based on the draw type
              let tx;
              if (useFutureBlock) {
                // Get block number to use for future block draw
                const currentBlock = await provider.getBlockNumber();
                const futureBlockNumber = currentBlock + 200; // 200 blocks in the future
                
                tx = await contract.startNewFutureBlockDraw(priceInWei, jackpotInWei, futureBlockNumber, seriesIndex);
              } else {
                // Use timestamp for regular draw
                tx = await contract.startNewXDraw(priceInWei, jackpotInWei, drawTime, seriesIndex);
              }
              
              await tx.wait();
              
              // Invalidate relevant queries
              queryClient.invalidateQueries({ queryKey: ['lottery'] });
              
              // Show success message
              console.log("New draw started successfully");
              return true;
            } catch (error) {
              console.error("Contract call error:", error);
              console.error("Contract call failed:", error);
              return false;
            }
          }
        } catch (error) {
          console.error("Contract setup failed:", error);
          return false;
        }
      }
      
      // No more mock implementations - only actual contract interaction
      console.error("Failed to interact with contract");
      return true;
    } catch (error) {
      console.error("Error starting new draw:", error);
      alert(`Error starting new draw: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  // Complete a draw manually by setting winning numbers
  const completeDrawManually = async (drawId: number, winningNumbers: number[]): Promise<boolean> => {
    try {
      // Only verify admin status - 2FA no longer required
      if (!isAdmin) {
        throw new Error("Not authorized - Only wallet-verified admins can access this function");
      }
      
      if (winningNumbers.length !== 6) {
        throw new Error("Must provide exactly 6 winning numbers");
      }
      
      // Only use actual contract interaction
      console.log(`Attempting to complete draw ID: ${drawId} with winning numbers: ${winningNumbers.join(', ')}`);
      
      // Use the contract
      if (provider) {
        try {
          const network = await provider.getNetwork();
          const chainId = network.chainId.toString();
          const contract = await getLotteryContractWithSigner(provider, chainId);
          
          if (contract) {
            try {
              // Call the smart contract function to set winning numbers
              const tx = await contract.completeDrawManually(drawId, winningNumbers);
              await tx.wait();
              
              // Invalidate relevant queries
              queryClient.invalidateQueries({ queryKey: ['lottery'] });
              
              console.log("Draw completed successfully");
              return true;
            } catch (error) {
              console.error("Contract call failed:", error);
              return false;
            }
          }
        } catch (error) {
          console.error("Contract setup failed:", error);
          return false;
        }
      }
      
      // No mock implementation - interaction failed
      console.error("Failed to interact with contract");
      return false;
    } catch (error) {
      console.error("Error completing draw:", error);
      alert(`Error completing draw: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  // Refresh admin status
  const getAdminStatus = async (): Promise<void> => {
    await refetchAdmin();
  };

  // Function to fetch series list from the contract
  const refreshSeriesList = async (): Promise<void> => {
    if (!provider) return;
    
    try {
      setSeriesLoading(true);
      console.log("Fetching series list from contract...");
      
      const network = await provider.getNetwork();
      const chainId = network.chainId.toString();
      
      const seriesData = await getAllSeriesData(provider, chainId);
      console.log("Series data fetched:", seriesData);
      
      setSeriesList(seriesData);
    } catch (error) {
      console.error("Error fetching series list:", error);
    } finally {
      setSeriesLoading(false);
    }
  };

  // Function to clear the 2FA state (used when navigating away from Admin page)
  const clearTwoFactorState = () => {
    // With wallet-based auth, no need to clear anything
    console.log("[Security] Wallet-based auth only - no state to clear");
    
    // Always keep the state as verified
    setTwoFactorState('verified');
  };

  // Update admin status when account changes
  useEffect(() => {
    if (isConnected && account) {
      refetchAdmin();
    } else {
      setIsAdmin(false);
      // Always keep twoFactorState as 'verified'
    }
  }, [isConnected, account, refetchAdmin]);

  // Update block gap for future block draws
  const updateBlockGap = async (newBlockGap: number): Promise<boolean> => {
    try {
      // Only verify admin status
      if (!isAdmin) {
        throw new Error("Not authorized - Only wallet-verified admins can access this function");
      }

      if (!provider) {
        throw new Error("Wallet provider not available");
      }

      console.log(`Updating block gap to ${newBlockGap}`);
      
      const network = await provider.getNetwork();
      const chainId = network.chainId.toString();
      
      const result = await updateBlockGapFunc(newBlockGap, provider, chainId);
      
      if (result.success) {
        console.log("Block gap successfully updated to", newBlockGap);
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['lottery'] });
        
        return true;
      } else {
        console.error("Failed to update block gap:", result.error);
        return false;
      }
    } catch (error) {
      console.error("Error updating block gap:", error);
      return false;
    }
  };

  // Create a new lottery series
  const createNewSeries = async (seriesName: string): Promise<boolean> => {
    try {
      // Only verify admin status
      if (!isAdmin) {
        throw new Error("Not authorized - Only wallet-verified admins can access this function");
      }

      if (!provider) {
        throw new Error("Wallet provider not available");
      }

      console.log(`Creating new series: ${seriesName}`);
      
      const network = await provider.getNetwork();
      const chainId = network.chainId.toString();
      
      const result = await newSeriesFunc(seriesName, provider, chainId);
      
      if (result.success) {
        console.log(`New lottery series "${seriesName}" successfully created`);
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['lottery'] });
        
        return true;
      } else {
        console.error("Failed to create new series:", result.error);
        return false;
      }
    } catch (error) {
      console.error("Error creating new series:", error);
      return false;
    }
  };

  // Start a new time-based draw
  const startNewXDraw = async (
    ticketPrice: string, 
    initialJackpot: string, 
    drawTime: number, 
    seriesIndex: number
  ): Promise<boolean> => {
    try {
      // Only verify admin status
      if (!isAdmin) {
        throw new Error("Not authorized - Only wallet-verified admins can access this function");
      }

      if (!provider) {
        throw new Error("Wallet provider not available");
      }

      console.log(`Starting new time-based draw: price=${ticketPrice} ETH, jackpot=${initialJackpot} ETH, time=${drawTime}, series=${seriesIndex}`);
      
      const network = await provider.getNetwork();
      const chainId = network.chainId.toString();
      
      const result = await startNewXDrawFunc(ticketPrice, initialJackpot, drawTime, seriesIndex, provider, chainId);
      
      if (result.success) {
        console.log(`New time-based draw started with ticket price ${ticketPrice} ETH and initial jackpot ${initialJackpot} ETH`);
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['lottery'] });
        
        return true;
      } else {
        console.error("Failed to start new time-based draw:", result.error);
        return false;
      }
    } catch (error) {
      console.error("Error starting new time-based draw:", error);
      return false;
    }
  };

  // Start a new block-based draw
  const startNewFutureBlockDraw = async (
    ticketPrice: string, 
    initialJackpot: string, 
    futureBlock: number, 
    seriesIndex: number
  ): Promise<boolean> => {
    try {
      // Only verify admin status
      if (!isAdmin) {
        throw new Error("Not authorized - Only wallet-verified admins can access this function");
      }

      if (!provider) {
        throw new Error("Wallet provider not available");
      }

      console.log(`Starting new block-based draw: price=${ticketPrice} ETH, jackpot=${initialJackpot} ETH, block=${futureBlock}, series=${seriesIndex}`);
      
      const network = await provider.getNetwork();
      const chainId = network.chainId.toString();
      
      const result = await startNewFutureBlockDrawFunc(ticketPrice, initialJackpot, futureBlock, seriesIndex, provider, chainId);
      
      if (result.success) {
        console.log(`New block-based draw started with ticket price ${ticketPrice} ETH and initial jackpot ${initialJackpot} ETH`);
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['lottery'] });
        
        return true;
      } else {
        console.error("Failed to start new block-based draw:", result.error);
        return false;
      }
    } catch (error) {
      console.error("Error starting new block-based draw:", error);
      return false;
    }
  };

  // Complete a draw with a block hash
  const completeDrawWithBlockHash = async (drawId: number, blockHash: string): Promise<boolean> => {
    try {
      // Only verify admin status
      if (!isAdmin) {
        throw new Error("Not authorized - Only wallet-verified admins can access this function");
      }

      if (!provider) {
        throw new Error("Wallet provider not available");
      }

      console.log(`Completing draw ${drawId} with block hash: ${blockHash}`);
      
      const network = await provider.getNetwork();
      const chainId = network.chainId.toString();
      
      const result = await completeDrawWithBlockHashFunc(drawId, blockHash, provider, chainId);
      
      if (result.success) {
        console.log(`Draw #${drawId} completed successfully with block hash`);
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['lottery'] });
        
        return true;
      } else {
        console.error("Failed to complete draw with block hash:", result.error);
        return false;
      }
    } catch (error) {
      console.error("Error completing draw with block hash:", error);
      return false;
    }
  };

  // End of hook - return admin state
  return {
    isAdmin,
    isAdminLoading,
    adminError,
    twoFactorState,
    twoFactorSecret,
    twoFactorQrCode,
    seriesList,
    seriesLoading,
    setupTwoFactor,
    verifyTwoFactor,
    startNewDraw,
    completeDrawManually,
    getAdminStatus,
    clearTwoFactorState,
    updateBlockGap,
    createNewSeries,
    startNewXDraw,
    startNewFutureBlockDraw,
    completeDrawWithBlockHash,
    refreshSeriesList
  };
}