import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWallet } from './useWallet';
import { getLotteryContract, getLotteryContractWithSigner } from '@/lib/lotteryContract';
import { parseEther } from '@/lib/web3';
import QRCode from 'qrcode';
import * as OTPAuth from 'otplib';

type TwoFactorState = 'not-setup' | 'setup' | 'verified';

export interface AdminState {
  isAdmin: boolean;
  isAdminLoading: boolean;
  adminError: Error | null;
  twoFactorState: TwoFactorState;
  twoFactorSecret?: string;
  twoFactorQrCode?: string;
  setupTwoFactor: () => Promise<{secret: string, qrCode: string}>;
  verifyTwoFactor: (token: string) => Promise<boolean>;
  startNewDraw: (ticketPrice: string, useFutureBlock: boolean) => Promise<boolean>;
  completeDrawManually: (drawId: number, winningNumbers: number[]) => Promise<boolean>;
  getAdminStatus: () => Promise<void>;
}

// This key is used to store 2FA state in localStorage
const ADMIN_2FA_KEY = 'admin_2fa_verified';
const ADMIN_2FA_SECRET_KEY = 'admin_2fa_secret';

export function useAdmin(): AdminState {
  const queryClient = useQueryClient();
  const { isConnected, account, provider } = useWallet();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminError, setAdminError] = useState<Error | null>(null);
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState>('not-setup');
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | undefined>();
  const [twoFactorQrCode, setTwoFactorQrCode] = useState<string | undefined>();

  // Check if the connected wallet is the admin
  const { isLoading: isAdminLoading, refetch: refetchAdmin } = useQuery({
    queryKey: ['admin', account],
    queryFn: async () => {
      try {
        if (!isConnected || !account) {
          setIsAdmin(false);
          return false;
        }

        if (!provider) {
          setIsAdmin(false);
          return false;
        }

        const network = await provider.getNetwork();
        const chainId = network.chainId.toString();
        const contract = getLotteryContract(provider, chainId);
        
        if (!contract) {
          setAdminError(new Error('Could not connect to lottery contract'));
          setIsAdmin(false);
          return false;
        }
        
        const adminAddress = await contract.owner();
        
        // Case-insensitive comparison of Ethereum addresses
        const isCurrentAdmin = adminAddress.toLowerCase() === account.toLowerCase();
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
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        setAdminError(error as Error);
        return false;
      }
    },
    enabled: isConnected && !!account,
    retry: 1,
  });

  // Generate QR code from secret
  const generateQrCode = async (secret: string, account: string) => {
    try {
      // Create OTP auth URL
      const service = 'CryptoLotto';
      const otpauth = OTPAuth.authenticator.keyuri(account, service, secret);
      
      // Generate QR code
      const qrCode = await QRCode.toDataURL(otpauth);
      setTwoFactorQrCode(qrCode);
      
      return qrCode;
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw error;
    }
  };

  // Setup two-factor authentication
  const setupTwoFactor = async (): Promise<{secret: string, qrCode: string}> => {
    try {
      if (!account) {
        throw new Error("Wallet not connected");
      }
      
      // Generate a random secret
      const secret = OTPAuth.authenticator.generateSecret();
      
      // Store the secret locally
      localStorage.setItem(ADMIN_2FA_SECRET_KEY, secret);
      setTwoFactorSecret(secret);
      
      // Generate QR code
      const qrCode = await generateQrCode(secret, account);
      
      // Update state
      setTwoFactorState('setup');
      
      return { secret, qrCode };
    } catch (error) {
      console.error("Error setting up 2FA:", error);
      throw error;
    }
  };

  // Verify two-factor authentication
  const verifyTwoFactor = async (token: string): Promise<boolean> => {
    try {
      if (!twoFactorSecret) {
        throw new Error("Two-factor authentication not set up");
      }
      
      // Verify the token
      const isValid = OTPAuth.authenticator.verify({
        token,
        secret: twoFactorSecret
      });
      
      if (isValid) {
        // Mark as verified in localStorage
        localStorage.setItem(ADMIN_2FA_KEY, 'true');
        
        // Update state
        setTwoFactorState('verified');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      throw error;
    }
  };

  // Start a new lottery draw
  const startNewDraw = async (ticketPrice: string, useFutureBlock: boolean): Promise<boolean> => {
    try {
      if (!isAdmin || twoFactorState !== 'verified') {
        throw new Error("Not authorized");
      }

      if (!provider) {
        throw new Error("Wallet not connected");
      }
      
      const network = await provider.getNetwork();
      const chainId = network.chainId.toString();
      const contract = await getLotteryContractWithSigner(provider, chainId);
      
      if (!contract) {
        throw new Error("Could not connect to lottery contract");
      }
      
      const priceInWei = parseEther(ticketPrice);
      
      // Call the smart contract function to start a new draw
      const tx = await contract.startNewDraw(priceInWei, useFutureBlock);
      await tx.wait();
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['lottery'] });
      
      // Show success message
      console.log("New draw started successfully");
      return true;
    } catch (error) {
      console.error("Error starting new draw:", error);
      throw error;
    }
  };

  // Complete a draw manually by setting winning numbers
  const completeDrawManually = async (drawId: number, winningNumbers: number[]): Promise<boolean> => {
    try {
      if (!isAdmin || twoFactorState !== 'verified') {
        throw new Error("Not authorized");
      }
      
      if (winningNumbers.length !== 6) {
        throw new Error("Must provide exactly 6 winning numbers");
      }
      
      if (!provider) {
        throw new Error("Wallet not connected");
      }
      
      const network = await provider.getNetwork();
      const chainId = network.chainId.toString();
      const contract = await getLotteryContractWithSigner(provider, chainId);
      
      if (!contract) {
        throw new Error("Could not connect to lottery contract");
      }
      
      // Call the smart contract function to set winning numbers
      const tx = await contract.completeDrawManually(drawId, winningNumbers);
      await tx.wait();
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['lottery'] });
      
      console.log("Draw completed successfully");
      return true;
    } catch (error) {
      console.error("Error completing draw:", error);
      throw error;
    }
  };

  // Refresh admin status
  const getAdminStatus = async (): Promise<void> => {
    await refetchAdmin();
  };

  // Update admin status when account changes
  useEffect(() => {
    if (isConnected && account) {
      refetchAdmin();
    } else {
      setIsAdmin(false);
      setTwoFactorState('not-setup');
    }
  }, [isConnected, account, refetchAdmin]);

  return {
    isAdmin,
    isAdminLoading,
    adminError,
    twoFactorState,
    twoFactorSecret,
    twoFactorQrCode,
    setupTwoFactor,
    verifyTwoFactor,
    startNewDraw,
    completeDrawManually,
    getAdminStatus
  };
}