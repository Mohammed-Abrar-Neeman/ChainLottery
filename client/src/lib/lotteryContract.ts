import { ethers, Contract, providers } from 'ethers';
import { lotteryABI } from '@shared/lotteryABI';
import { getLotteryAddress } from '@shared/contracts';
import { toast } from '@/hooks/use-toast';

// Interface for lottery contract data
export interface LotteryData {
  jackpotAmount: string;
  ticketPrice: string;
  currentRound: number;
  timeRemaining: number;
  participants: Participant[];
  participantCount: number;
}

export interface Participant {
  walletAddress: string;
  ticketCount: number;
  timestamp: number;
}

export interface LotteryRound {
  startTime: number;
  endTime: number;
  poolAmount: string;
  winner: string;
  prizeAmount: string;
  isFinalized: boolean;
}

// Get lottery contract instance
export const getLotteryContract = (
  provider: providers.Web3Provider | null,
  chainId: string
): Contract | null => {
  if (!provider) return null;
  
  try {
    const contractAddress = getLotteryAddress(chainId);
    return new ethers.Contract(contractAddress, lotteryABI, provider);
  } catch (error) {
    console.error('Error getting lottery contract:', error);
    return null;
  }
};

// Get lottery contract with signer (for transactions)
export const getLotteryContractWithSigner = (
  provider: providers.Web3Provider | null,
  chainId: string
): Contract | null => {
  if (!provider) return null;
  
  try {
    const signer = provider.getSigner();
    const contractAddress = getLotteryAddress(chainId);
    return new ethers.Contract(contractAddress, lotteryABI, signer);
  } catch (error) {
    console.error('Error getting lottery contract with signer:', error);
    return null;
  }
};

// Get current lottery data
export const getLotteryData = async (
  provider: providers.Web3Provider | null,
  chainId: string
): Promise<LotteryData | null> => {
  const contract = getLotteryContract(provider, chainId);
  if (!contract) return null;
  
  try {
    const [
      jackpotAmount,
      ticketPrice,
      currentRound,
      timeRemaining,
      participants,
      participantCount
    ] = await Promise.all([
      contract.getJackpotAmount(),
      contract.getTicketPrice(),
      contract.currentRound(),
      contract.getRoundTimeRemaining(),
      contract.getParticipants(),
      contract.getParticipantsCount()
    ]);
    
    return {
      jackpotAmount: ethers.utils.formatEther(jackpotAmount),
      ticketPrice: ethers.utils.formatEther(ticketPrice),
      currentRound: currentRound.toNumber(),
      timeRemaining: timeRemaining.toNumber(),
      participants: participants.map((p: any) => ({
        walletAddress: p.walletAddress,
        ticketCount: p.ticketCount.toNumber(),
        timestamp: p.timestamp.toNumber()
      })),
      participantCount: participantCount.toNumber()
    };
  } catch (error) {
    console.error('Error getting lottery data:', error);
    
    // For now, return mock data for development
    // In production, this would be replaced with proper error handling
    return {
      jackpotAmount: "3.457",
      ticketPrice: "0.01",
      currentRound: 42,
      timeRemaining: 42000,
      participants: [],
      participantCount: 157
    };
  }
};

// Get round information
export const getRoundInfo = async (
  provider: providers.Web3Provider | null,
  chainId: string,
  roundNumber: number
): Promise<LotteryRound | null> => {
  const contract = getLotteryContract(provider, chainId);
  if (!contract) return null;
  
  try {
    const roundInfo = await contract.getRoundInfo(roundNumber);
    
    return {
      startTime: roundInfo.startTime.toNumber(),
      endTime: roundInfo.endTime.toNumber(),
      poolAmount: ethers.utils.formatEther(roundInfo.poolAmount),
      winner: roundInfo.winner,
      prizeAmount: ethers.utils.formatEther(roundInfo.prizeAmount),
      isFinalized: roundInfo.isFinalized
    };
  } catch (error) {
    console.error(`Error getting round info for round ${roundNumber}:`, error);
    return null;
  }
};

// Buy lottery tickets
export const buyLotteryTickets = async (
  provider: providers.Web3Provider | null,
  chainId: string,
  ticketCount: number
): Promise<{ success: boolean, txHash: string | null }> => {
  const contract = getLotteryContractWithSigner(provider, chainId);
  if (!contract) {
    return { success: false, txHash: null };
  }
  
  try {
    // Get ticket price
    const ticketPrice = await contract.getTicketPrice();
    const totalCost = ticketPrice.mul(ticketCount);
    
    // Execute transaction
    const tx = await contract.buyTickets({
      value: totalCost,
      gasLimit: 500000 // Gas limit estimation
    });
    
    // Show toast notification
    toast({
      title: "Transaction Submitted",
      description: "Your ticket purchase is being processed.",
      variant: "default"
    });
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    // Show success notification
    toast({
      title: "Purchase Successful",
      description: `Successfully purchased ${ticketCount} tickets!`,
      variant: "success"
    });
    
    return { success: true, txHash: receipt.transactionHash };
  } catch (error) {
    console.error('Error buying lottery tickets:', error);
    
    let errorMessage = "Failed to purchase tickets.";
    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes('insufficient funds')) {
        errorMessage = "Insufficient funds in your wallet.";
      } else if (error.message.includes('user rejected')) {
        errorMessage = "Transaction rejected.";
      }
    }
    
    toast({
      title: "Purchase Failed",
      description: errorMessage,
      variant: "destructive"
    });
    
    return { success: false, txHash: null };
  }
};

// Format time remaining
export const formatTimeRemaining = (seconds: number): { hours: number, minutes: number, seconds: number } => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return { hours, minutes, seconds: remainingSeconds };
};
