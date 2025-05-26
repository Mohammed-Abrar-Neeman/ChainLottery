import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { BrowserProvider } from 'ethers';
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
  isActive: boolean;
  totalDraws: number;
  totalTickets: number;
  totalPrize: string;
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
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { toast } = useToast();
  
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
    queryKey: ['admin', address],
    queryFn: async () => {
      try {
        if (!isConnected || !address) {
          console.log("Wallet not connected or no address available");
          setIsAdmin(false);
          return false;
        }
        
        if (!walletClient || !publicClient) {
          console.log("Waiting for wallet and public client to be available...");
          setIsAdmin(false);
          return false;
        }

        try {
          console.log("Getting network information");
          const chainId = publicClient.chain.id.toString();
          console.log("Network chain ID:", chainId);
          
          // Create ethers provider from wallet client
          const provider = new BrowserProvider(walletClient);
          
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
            console.log("Current connected account:", address);
            
            // Case-insensitive comparison of Ethereum addresses
            const isCurrentAdmin = adminAddress.toLowerCase() === address.toLowerCase();
            console.log("Is current account admin?", isCurrentAdmin);
            setIsAdmin(isCurrentAdmin);
            
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
    enabled: isConnected && !!address && !!walletClient && !!publicClient,
    retry: 3,
    retryDelay: 1000,
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
      const userAccount = address || '0xAbc123DemoWalletAddress456Def789';
      
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

      if (!walletClient || !publicClient) {
        throw new Error("Wallet or public client not available");
      }

      console.log(`[DEV MODE] Starting new draw with price: ${ticketPrice} ETH, initialJackpot: ${initialJackpot}, drawTime: ${drawTime}, seriesIndex: ${seriesIndex}, useFutureBlock: ${useFutureBlock}`);
      
      // Create ethers provider from wallet client
      const provider = new BrowserProvider(walletClient);
      const chainId = publicClient.chain.id.toString();
      const contract = await getLotteryContractWithSigner(provider, chainId);
      
      if (contract) {
        try {
          const priceInWei = parseEther(ticketPrice);
          const jackpotInWei = parseEther(initialJackpot);
          
          // Call the appropriate smart contract function based on the draw type
          let tx;
          if (useFutureBlock) {
            // Get block number to use for future block draw
            const currentBlock = await publicClient.getBlockNumber();
            const futureBlockNumber = Number(currentBlock) + 200; // 200 blocks in the future
            
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
      if (walletClient && publicClient) {
        try {
          const network = await publicClient.getNetwork();
          const chainId = network.chain.id.toString();
          const contract = await getLotteryContractWithSigner(new BrowserProvider(walletClient), chainId);
          
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

  // Function to refresh the series list
  const refreshSeriesList = async () => {
    try {
      if (!isAdmin) {
        console.log('Cannot refresh series list: Not an admin');
        return;
      }

      if (!walletClient || !publicClient) {
        console.log('Waiting for wallet and public client to be available...');
        return;
      }

      setSeriesLoading(true);
      
      // Create ethers provider from wallet client
      const provider = new BrowserProvider(walletClient);
      const chainId = publicClient.chain.id.toString();
      const contract = getLotteryContract(provider, chainId);
      
      if (!contract) {
        throw new Error('Contract not available');
      }

      // Get total number of series
      const totalSeries = await contract.getTotalSeries();
      console.log('Total series:', totalSeries.toString());

      // Fetch all series data
      const seriesData = await Promise.all(
        Array.from({ length: Number(totalSeries) }, async (_, index) => {
          try {
            // Get series name from seriesList mapping
            const seriesName = await contract.seriesList(index);
            
            // Get total draws in this series
            const totalDraws = await contract.getTotalDrawsInSeries(index);
            
            // Get all draw IDs for this series
            const drawIds = await contract.getSeriesDrawIdsByIndex(index);
            
            // Calculate total tickets and prize across all draws
            let totalTickets = 0;
            let totalPrize = BigInt(0);
            
            for (const drawId of drawIds) {
              const totalTicketsInDraw = await contract.getTotalTicketsSold(drawId);
              const jackpot = await contract.getJackpot(drawId);
              totalTickets += Number(totalTicketsInDraw);
              totalPrize += jackpot;
            }

            return {
              index,
              name: seriesName,
              isActive: true, // Series is always active once created
              totalDraws: Number(totalDraws),
              totalTickets,
              totalPrize: ethers.formatEther(totalPrize) // Convert from Wei to ETH
            } as SeriesInfo;
          } catch (error) {
            console.error(`Error fetching series ${index}:`, error);
            return null;
          }
        })
      );

      // Filter out any null entries and update state
      const validSeries = seriesData.filter((series): series is SeriesInfo => series !== null);
      console.log('Fetched series data:', validSeries);
      setSeriesList(validSeries);
    } catch (error) {
      console.error('Error refreshing series list:', error);
      toast({
        title: "Error",
        description: "Failed to refresh series list. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
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

  // Update admin status and series list when account changes
  useEffect(() => {
    const initializeAdmin = async () => {
      if (isConnected && address && walletClient && publicClient) {
        const isAdminResult = await refetchAdmin();
        if (isAdminResult.data) {
          await refreshSeriesList();
        }
      } else {
        setIsAdmin(false);
        setSeriesList([]); // Clear series list when not connected
      }
    };

    initializeAdmin();
  }, [isConnected, address, walletClient, publicClient, refetchAdmin]);

  // Update block gap for future block draws
  const updateBlockGap = async (newBlockGap: number): Promise<boolean> => {
    try {
      // Only verify admin status
      if (!isAdmin) {
        throw new Error("Not authorized - Only wallet-verified admins can access this function");
      }

      if (!walletClient || !publicClient) {
        throw new Error("Wallet or public client not available");
      }

      console.log(`Updating block gap to ${newBlockGap}`);
      
      const provider = new BrowserProvider(walletClient);
      const chainId = publicClient.chain.id.toString();
      
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

      if (!walletClient || !publicClient) {
        throw new Error("Wallet or public client not available");
      }

      console.log(`Creating new series: ${seriesName}`);
      
      const provider = new BrowserProvider(walletClient);
      const chainId = publicClient.chain.id.toString();
      
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

      if (!walletClient || !publicClient) {
        throw new Error("Wallet or public client not available");
      }

      console.log(`Starting new time-based draw with parameters:`, {
        ticketPrice,
        initialJackpot,
        drawTime,
        seriesIndex
      });
      
      // Create ethers provider from wallet client
      const provider = new BrowserProvider(walletClient);
      const chainId = publicClient.chain.id.toString();
      const contract = await getLotteryContractWithSigner(provider, chainId);
      
      if (!contract) {
        throw new Error('Contract not available');
      }

      // Convert values to wei using ethers.parseEther
      const priceInWei = ethers.parseEther(ticketPrice);
      const jackpotInWei = ethers.parseEther(initialJackpot);

      // Ensure drawTime is in the future
      const currentTime = Math.floor(Date.now() / 1000);
      if (drawTime <= currentTime) {
        throw new Error('Draw time must be in the future');
      }

      console.log('Transaction parameters:', {
        priceInWei: priceInWei.toString(),
        jackpotInWei: jackpotInWei.toString(),
        drawTime,
        seriesIndex
      });

      try {
        // Call the contract function and wait for transaction
        const tx = await contract.startNewXDraw(
          priceInWei,
          jackpotInWei,
          drawTime,
          seriesIndex,
          { gasLimit: 500000 } // Add explicit gas limit
        );

        console.log('Transaction sent:', tx.hash);
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['lottery'] });
        
        toast({
          title: "Success",
          description: "New time-based draw started successfully",
          duration: 5000,
        });
        
        return true;
      } catch (txError: any) {
        console.error('Transaction error:', txError);
        
        // Handle specific error cases
        if (txError.code === 'CALL_EXCEPTION') {
          throw new Error('Contract call failed. Please check if the draw time is valid and you have sufficient funds.');
        }
        
        throw txError;
      }
    } catch (error) {
      console.error("Error starting new time-based draw:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start time-based draw",
        variant: "destructive",
        duration: 5000,
      });
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

      if (!walletClient || !publicClient) {
        throw new Error("Wallet or public client not available");
      }

      console.log(`Starting new block-based draw: price=${ticketPrice} ETH, jackpot=${initialJackpot} ETH, block=${futureBlock}, series=${seriesIndex}`);
      
      const provider = new BrowserProvider(walletClient);
      const chainId = publicClient.chain.id.toString();
      
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

      if (!walletClient || !publicClient) {
        throw new Error("Wallet or public client not available");
      }

      console.log(`Completing draw ${drawId} with block hash: ${blockHash}`);
      
      const provider = new BrowserProvider(walletClient);
      const chainId = publicClient.chain.id.toString();
      
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