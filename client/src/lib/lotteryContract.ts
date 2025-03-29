import { ethers } from 'ethers';
import { lotteryABI } from '@shared/lotteryABI';
import { getLotteryAddress } from '@shared/contracts';
import { toast } from '@/hooks/use-toast';

// Interface for lottery contract data
export interface LotteryData {
  jackpotAmount: string;
  ticketPrice: string;
  currentDraw: number;
  timeRemaining: number;
  participants: Participant[];
  participantCount: number;
}

export interface Participant {
  walletAddress: string;
  ticketCount: number;
  timestamp: number;
}

export interface LotteryTicket {
  numbers: number[];
  lottoNumber: number;
  buyer: string;
}

export interface LotteryDraw {
  ticketPrice: string;
  jackpot: string;
  drawBlock: number;
  isFutureBlockDraw: boolean;
  completed: boolean;
  winningNumbers?: number[];
}

// Get lottery contract instance
export const getLotteryContract = (
  provider: ethers.BrowserProvider | null,
  chainId: string
): ethers.Contract | null => {
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
export const getLotteryContractWithSigner = async (
  provider: ethers.BrowserProvider | null,
  chainId: string
): Promise<ethers.Contract | null> => {
  if (!provider) return null;
  
  try {
    const signer = await provider.getSigner();
    const contractAddress = getLotteryAddress(chainId);
    return new ethers.Contract(contractAddress, lotteryABI, signer);
  } catch (error) {
    console.error('Error getting lottery contract with signer:', error);
    return null;
  }
};

// Get current lottery data
export const getLotteryData = async (
  provider: ethers.BrowserProvider | null,
  chainId: string
): Promise<LotteryData | null> => {
  const contract = getLotteryContract(provider, chainId);
  if (!contract) return null;
  
  try {
    // Get current draw ID
    const currentDraw = await contract.drawId();
    
    // Get current draw info
    const drawInfo = await contract.draws(currentDraw);
    
    // Get total tickets sold for this draw
    const ticketsSold = await contract.getTotalTicketsSold(currentDraw);
    
    // Calculate time remaining (using block time estimation)
    let currentBlock = 0;
    if (provider) {
      currentBlock = await provider.getBlockNumber();
    }
    const blocksRemaining = Math.max(0, Number(drawInfo.drawBlock) - currentBlock);
    const timeRemaining = blocksRemaining * 12; // Approx 12 seconds per block
    
    // For our interface we still need the same data shape
    return {
      jackpotAmount: ethers.formatEther(drawInfo.jackpot),
      ticketPrice: ethers.formatEther(drawInfo.ticketPrice),
      currentDraw: Number(currentDraw),
      timeRemaining: timeRemaining,
      participants: [], // Server API will handle participant data
      participantCount: Number(ticketsSold)
    };
  } catch (error) {
    console.error('Error getting lottery data:', error);
    return null;
  }
};

// Get information for a specific draw
export const getDrawInfo = async (
  provider: ethers.BrowserProvider | null,
  chainId: string,
  drawId: number
): Promise<LotteryDraw | null> => {
  const contract = getLotteryContract(provider, chainId);
  if (!contract) return null;
  
  try {
    const drawInfo = await contract.draws(drawId);
    
    return {
      ticketPrice: ethers.formatEther(drawInfo.ticketPrice),
      jackpot: ethers.formatEther(drawInfo.jackpot),
      drawBlock: Number(drawInfo.drawBlock),
      isFutureBlockDraw: drawInfo.isFutureBlockDraw,
      completed: drawInfo.completed
    };
  } catch (error) {
    console.error(`Error getting draw info for draw ${drawId}:`, error);
    return null;
  }
};

// Generate a quick pick ticket (5 random numbers plus 1 LOTTO number)
export const generateQuickPick = (): { numbers: number[], lottoNumber: number } => {
  // Generate 5 unique random numbers between 1-70
  const numbers: number[] = [];
  while (numbers.length < 5) {
    const num = Math.floor(Math.random() * 70) + 1;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  
  // Generate 1 random LOTTO number between 1-30
  const lottoNumber = Math.floor(Math.random() * 30) + 1;
  
  // Sort numbers for display
  numbers.sort((a, b) => a - b);
  
  return { numbers, lottoNumber };
};

// Buy lottery ticket with 5 numbers and 1 LOTTO number
export const buyLotteryTicket = async (
  provider: ethers.BrowserProvider | null,
  chainId: string,
  numbers: number[],
  lottoNumber: number
): Promise<{ success: boolean, txHash: string | null }> => {
  const contract = await getLotteryContractWithSigner(provider, chainId);
  if (!contract) {
    return { success: false, txHash: null };
  }
  
  try {
    // Get current draw ID
    const currentDraw = await contract.drawId();
    
    // Check that we have 5 numbers
    if (numbers.length !== 5) {
      throw new Error('You must select 5 numbers (1-70)');
    }
    
    // Check that numbers are in range
    for (let num of numbers) {
      if (num < 1 || num > 70) {
        throw new Error('Numbers must be between 1 and 70');
      }
    }
    
    // Check that LOTTO number is in range
    if (lottoNumber < 1 || lottoNumber > 30) {
      throw new Error('LOTTO number must be between 1 and 30');
    }
    
    // Get the ticket price
    const drawInfo = await contract.draws(currentDraw);
    const ticketPrice = drawInfo.ticketPrice;
    
    // Show toast notification
    toast({
      title: "Transaction Pending",
      description: "Please confirm the transaction in your wallet.",
      variant: "default"
    });
    
    // Buy ticket
    const tx = await contract.buyTicket(currentDraw, numbers, lottoNumber, { 
      value: ticketPrice,
      gasLimit: 500000 // Gas limit estimation
    });
    
    // Show processing notification
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
      description: `Successfully purchased lottery ticket for Draw #${currentDraw}.`,
      variant: "default"
    });
    
    return { success: true, txHash: receipt.hash };
  } catch (error) {
    console.error('Error buying lottery ticket:', error);
    
    let errorMessage = "Failed to purchase ticket.";
    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes('insufficient funds')) {
        errorMessage = "Insufficient funds in your wallet.";
      } else if (error.message.includes('user rejected')) {
        errorMessage = "Transaction rejected.";
      } else {
        errorMessage = error.message;
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
