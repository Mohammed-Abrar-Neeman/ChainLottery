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
  endTimestamp?: number; // Unix timestamp when draw ends (for client-side countdown)
  participants: Participant[];
  participantCount: number;
  seriesIndex?: number; // Added series index
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
  drawId: number;        // Draw ID within the series
  seriesIndex: number;   // Series index this draw belongs to
  ticketPrice: string;
  jackpot: string;
  drawBlock: number;
  isFutureBlockDraw: boolean;
  completed: boolean;
  winningNumbers?: number[];
}

export interface LotterySeries {
  index: number;
  active: boolean;
  drawCount: number;
  name: string;
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
  chainId: string,
  seriesIndex?: number,
  drawId?: number
): Promise<LotteryData | null> => {
  const contract = getLotteryContract(provider, chainId);
  if (!contract) return null;
  
  try {
    // If no specific drawId is provided, use the current draw or default to 1
    let targetDrawId = drawId;
    try {
      if (targetDrawId === undefined) {
        targetDrawId = await contract.drawId();
      }
    } catch (drawIdError) {
      console.log('Could not get current draw ID, using default', drawIdError);
      targetDrawId = 1; // Default to draw ID 1 if we can't get the current
    }
    
    // Get draw info with fallback
    let drawInfo;
    try {
      drawInfo = await contract.draws(targetDrawId);
    } catch (drawInfoError) {
      console.log(`Could not get draw info for draw ${targetDrawId}, using defaults`, drawInfoError);
      // Create a default draw info with reasonable values
      drawInfo = {
        jackpot: ethers.parseEther('10'),
        ticketPrice: ethers.parseEther('0.01'),
        drawBlock: 0,
        completed: false,
        isFutureBlockDraw: false
      };
    }
    
    // Get series index for this draw if not provided
    let targetSeriesIndex = seriesIndex ?? 0;
    try {
      if (seriesIndex === undefined) {
        const seriesIdx = await contract.getDrawSeries(targetDrawId);
        targetSeriesIndex = Number(seriesIdx);
      }
    } catch (seriesError) {
      console.log(`Could not get series index for draw ${targetDrawId}, using default`, seriesError);
      // Default to series 0 if we can't determine
    }
    
    // Get total tickets sold for this draw
    let ticketsSold = 0;
    try {
      const sold = await contract.getTotalTicketsSold(targetDrawId);
      ticketsSold = Number(sold);
    } catch (ticketsError) {
      console.log(`Could not get tickets sold for draw ${targetDrawId}, using default`, ticketsError);
    }
    
    // Calculate time remaining (using getEstimatedEndTime from contract)
    let timeRemaining = 86400; // Default to 24 hours
    let endTimestamp;
    
    try {
      // Try to get the estimated end time from the contract
      const estimatedEndTime = await contract.getEstimatedEndTime(targetDrawId);
      endTimestamp = Number(estimatedEndTime) * 1000; // Convert to milliseconds
      const now = Date.now();
      
      if (endTimestamp > now) {
        // Calculate seconds remaining
        timeRemaining = Math.floor((endTimestamp - now) / 1000);
      } else {
        // If the end time is in the past, set a small time remaining
        timeRemaining = 0;
      }
      
      console.log(`End time for draw ${targetDrawId}: ${new Date(endTimestamp).toISOString()}, time remaining: ${timeRemaining}s`);
    } catch (timeError) {
      console.log('Could not get estimated end time, falling back to block calculation', timeError);
      
      // Fallback to block-based calculation
      try {
        let currentBlock = 0;
        if (provider) {
          currentBlock = await provider.getBlockNumber();
        }
        const blocksRemaining = Math.max(0, Number(drawInfo.drawBlock) - currentBlock);
        timeRemaining = blocksRemaining * 12; // Approx 12 seconds per block
        
        // Set endTimestamp based on calculated time remaining
        endTimestamp = Date.now() + (timeRemaining * 1000);
      } catch (blockError) {
        console.log('Could not calculate time remaining, using default', blockError);
        endTimestamp = Date.now() + (timeRemaining * 1000);
      }
    }
    
    // For our interface we still need the same data shape with added endTimestamp
    return {
      jackpotAmount: ethers.formatEther(drawInfo.jackpot),
      ticketPrice: ethers.formatEther(drawInfo.ticketPrice),
      currentDraw: Number(targetDrawId),
      timeRemaining: timeRemaining,
      endTimestamp: Math.floor(endTimestamp / 1000), // Store end timestamp (in seconds) for client-side countdown
      participants: [], // Server API will handle participant data
      participantCount: ticketsSold,
      seriesIndex: targetSeriesIndex
    };
  } catch (error) {
    console.error('Error getting lottery data:', error);
    
    // Return a default data structure as fallback
    const defaultTimeRemaining = 86400;
    return {
      jackpotAmount: '10',
      ticketPrice: '0.01',
      currentDraw: drawId ?? 1,
      timeRemaining: defaultTimeRemaining,
      endTimestamp: Math.floor(Date.now() / 1000) + defaultTimeRemaining,
      participants: [],
      participantCount: 0,
      seriesIndex: seriesIndex ?? 0
    };
  }
};

// Get all available series
export const getSeriesList = async (
  provider: ethers.BrowserProvider | null,
  chainId: string
): Promise<LotterySeries[]> => {
  const contract = getLotteryContract(provider, chainId);
  if (!contract) return [];
  
  try {
    // Since we know there are 3 series in the contract, we'll manually fetch info for each
    const seriesList: LotterySeries[] = [];
    
    // Hardcoded to fetch 3 series (indices 0, 1, 2)
    const seriesCount = 3;
    
    for (let i = 0; i < seriesCount; i++) {
      try {
        // Try to get the draws in this series
        let drawCount = 1;
        try {
          drawCount = await contract.getSeriesDrawCount(i);
          drawCount = Number(drawCount);
        } catch (drawCountError) {
          console.log(`Series ${i} draw count not available, using default`, drawCountError);
        }
        
        // Try to get series name using getSeriesNameByIndex function
        let seriesName = `Series ${i}`;
        
        try {
          // Use the specific contract function to get series name
          const name = await contract.getSeriesNameByIndex(i);
          if (name) {
            seriesName = name;
          }
        } catch (nameError) {
          console.log(`Could not get name for series ${i}, using default`, nameError);
        }
        
        // Get series info if possible
        let isActive = true;
        try {
          const seriesInfo = await contract.series(i);
          isActive = seriesInfo?.active ?? true;
        } catch (activeError) {
          console.log(`Could not get active status for series ${i}, using default true`, activeError);
        }
        
        seriesList.push({
          index: i,
          active: isActive,
          drawCount: drawCount,
          name: seriesName
        });
      } catch (seriesError) {
        console.error(`Error fetching series ${i}:`, seriesError);
        // Add a default series entry with index preserved
        seriesList.push({
          index: i,
          active: true,
          drawCount: 1,
          name: `Series ${i}`
        });
      }
    }
    
    // Return all series we were able to fetch
    return seriesList;
    
  } catch (error) {
    console.error('Error getting series list:', error);
    // If all else fails, return 3 default series
    return [
      {
        index: 0,
        active: true,
        drawCount: 1,
        name: "Series 0"
      },
      {
        index: 1,
        active: true,
        drawCount: 1,
        name: "Series 1"
      },
      {
        index: 2,
        active: true,
        drawCount: 1,
        name: "Series 2"
      }
    ];
  }
};

// Get all draws in a series
export const getSeriesDraws = async (
  provider: ethers.BrowserProvider | null,
  chainId: string,
  seriesIndex: number
): Promise<LotteryDraw[]> => {
  const contract = getLotteryContract(provider, chainId);
  if (!contract) return [];
  
  try {
    const draws: LotteryDraw[] = [];
    
    // Try to get all draw IDs for this series using getSeriesDrawIdsByIndex
    let drawIds: number[] = [];
    try {
      const ids = await contract.getSeriesDrawIdsByIndex(seriesIndex);
      drawIds = ids.map((id: any) => Number(id));
      
      // If we didn't get any draw IDs, fall back to the old method
      if (drawIds.length === 0) {
        throw new Error('No draw IDs found for series');
      }
    } catch (drawIdsError) {
      console.log(`Could not get draw IDs for series ${seriesIndex}, using fallback method`, drawIdsError);
      
      // Fall back to previous method
      let drawCount = 1;
      try {
        const count = await contract.getSeriesDrawCount(seriesIndex);
        drawCount = Number(count);
      } catch (drawCountError) {
        console.log(`Could not get draw count for series ${seriesIndex}, using default`, drawCountError);
      }
      
      // Generate fallback drawIds
      for (let i = 0; i < drawCount; i++) {
        try {
          const id = await contract.getDrawId(seriesIndex, i);
          drawIds.push(Number(id));
        } catch (drawIdError) {
          // If we can't get the draw ID, use a simple computation
          const computedId = seriesIndex * 100 + i + 1;
          drawIds.push(computedId);
          console.log(`Could not get draw ID for series ${seriesIndex} index ${i}, using computed value ${computedId}`, drawIdError);
        }
      }
    }
    
    // If we can't get any draw IDs, add one default draw
    if (drawIds.length === 0) {
      const defaultDraw: LotteryDraw = {
        drawId: 1,
        seriesIndex,
        ticketPrice: '0.01',
        jackpot: '10',
        drawBlock: 0,
        isFutureBlockDraw: false,
        completed: false
      };
      draws.push(defaultDraw);
      return draws;
    }
    
    // Try to get actual draws using the collected draw IDs
    for (const drawId of drawIds) {
      try {
        
        // Try to get draw info
        let drawInfo;
        try {
          drawInfo = await contract.draws(drawId);
        } catch (drawInfoError) {
          console.log(`Could not get draw info for draw ${drawId}, using defaults`, drawInfoError);
          // Create default draw info
          drawInfo = {
            ticketPrice: ethers.parseEther('0.01'),
            jackpot: ethers.parseEther('10'),
            drawBlock: 0,
            isFutureBlockDraw: false,
            completed: false
          };
        }
        
        draws.push({
          drawId,
          seriesIndex,
          ticketPrice: ethers.formatEther(drawInfo.ticketPrice),
          jackpot: ethers.formatEther(drawInfo.jackpot),
          drawBlock: Number(drawInfo.drawBlock),
          isFutureBlockDraw: drawInfo.isFutureBlockDraw,
          completed: drawInfo.completed
        });
      } catch (error) {
        console.error(`Error fetching draw ${drawId} in series ${seriesIndex}:`, error);
      }
    }
    
    // If we couldn't get any draws despite trying, return a default
    if (draws.length === 0) {
      const defaultDraw: LotteryDraw = {
        drawId: 1,
        seriesIndex,
        ticketPrice: '0.01',
        jackpot: '10',
        drawBlock: 0,
        isFutureBlockDraw: false,
        completed: false
      };
      draws.push(defaultDraw);
    }
    
    return draws;
  } catch (error) {
    console.error(`Error getting draws for series ${seriesIndex}:`, error);
    // Return a default draw if everything fails
    return [{
      drawId: 1,
      seriesIndex,
      ticketPrice: '0.01',
      jackpot: '10',
      drawBlock: 0,
      isFutureBlockDraw: false,
      completed: false
    }];
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
    // Try to get draw info
    let drawInfo;
    try {
      drawInfo = await contract.draws(drawId);
    } catch (drawInfoError) {
      console.log(`Could not get draw info for draw ${drawId}, using defaults`, drawInfoError);
      // Create default draw info
      drawInfo = {
        ticketPrice: ethers.parseEther('0.01'),
        jackpot: ethers.parseEther('10'),
        drawBlock: 0,
        isFutureBlockDraw: false,
        completed: false
      };
    }
    
    // Try to get series index
    let seriesIndex = 0;
    try {
      const idx = await contract.getDrawSeries(drawId);
      seriesIndex = Number(idx);
    } catch (seriesError) {
      console.log(`Could not get series index for draw ${drawId}, using default`, seriesError);
    }
    
    return {
      drawId,
      seriesIndex,
      ticketPrice: ethers.formatEther(drawInfo.ticketPrice),
      jackpot: ethers.formatEther(drawInfo.jackpot),
      drawBlock: Number(drawInfo.drawBlock),
      isFutureBlockDraw: drawInfo.isFutureBlockDraw,
      completed: drawInfo.completed
    };
  } catch (error) {
    console.error(`Error getting draw info for draw ${drawId}:`, error);
    
    // Return default draw info if all else fails
    return {
      drawId,
      seriesIndex: 0,
      ticketPrice: '0.01',
      jackpot: '10',
      drawBlock: 0,
      isFutureBlockDraw: false,
      completed: false
    };
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
  lottoNumber: number,
  seriesIndex?: number,
  drawId?: number
): Promise<{ success: boolean, txHash: string | null }> => {
  const contract = await getLotteryContractWithSigner(provider, chainId);
  if (!contract) {
    toast({
      title: "Purchase Failed",
      description: "Could not connect to lottery contract.",
      variant: "destructive"
    });
    return { success: false, txHash: null };
  }
  
  try {
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
    
    // Use the provided draw ID or fetch the current one
    let currentDraw;
    if (drawId !== undefined) {
      currentDraw = drawId;
    } else {
      try {
        currentDraw = await contract.drawId();
      } catch (drawIdError) {
        console.error('Error getting current draw ID:', drawIdError);
        toast({
          title: "Purchase Failed",
          description: "Could not determine the current draw.",
          variant: "destructive"
        });
        return { success: false, txHash: null };
      }
    }
    
    // Get the ticket price
    let ticketPrice;
    try {
      const drawInfo = await contract.draws(currentDraw);
      ticketPrice = drawInfo.ticketPrice;
    } catch (priceError) {
      console.error('Error getting ticket price:', priceError);
      toast({
        title: "Purchase Failed",
        description: "Could not determine the ticket price.",
        variant: "destructive"
      });
      return { success: false, txHash: null };
    }
    
    // Show toast notification
    toast({
      title: "Transaction Pending",
      description: "Please confirm the transaction in your wallet.",
      variant: "default"
    });
    
    // Buy ticket
    let tx;
    try {
      tx = await contract.buyTicket(currentDraw, numbers, lottoNumber, { 
        value: ticketPrice,
        gasLimit: 500000 // Gas limit estimation
      });
    } catch (buyError: any) {
      console.error('Error initiating ticket purchase:', buyError);
      
      let errorMessage = "Failed to initiate ticket purchase.";
      if (buyError?.message) {
        // Handle specific errors
        if (buyError.message.includes('insufficient funds')) {
          errorMessage = "Insufficient funds in your wallet.";
        } else if (buyError.message.includes('user rejected')) {
          errorMessage = "Transaction rejected by user.";
        } else if (buyError.message.includes('already ended')) {
          errorMessage = "This lottery draw has already ended.";
        } else if (buyError.message.includes('not started')) {
          errorMessage = "This lottery draw has not started yet.";
        } else {
          errorMessage = buyError.message.split('(')[0].trim(); // Get only the first part of the error message
        }
      }
      
      toast({
        title: "Purchase Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      return { success: false, txHash: null };
    }
    
    // Show processing notification
    toast({
      title: "Transaction Submitted",
      description: "Your ticket purchase is being processed.",
      variant: "default"
    });
    
    // Wait for transaction to be mined
    let receipt;
    try {
      receipt = await tx.wait();
    } catch (confirmError) {
      console.error('Error confirming transaction:', confirmError);
      toast({
        title: "Purchase Status Unknown",
        description: "Your transaction was submitted, but we couldn't confirm if it was successful. Please check your wallet for transaction status.",
        variant: "default"
      });
      return { success: false, txHash: tx.hash };
    }
    
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

// Get total draws count in a series
export const getTotalDrawsInSeries = async (
  provider: ethers.BrowserProvider | null,
  chainId: string,
  seriesIndex: number
): Promise<number> => {
  const contract = getLotteryContract(provider, chainId);
  if (!contract) return 0;
  
  try {
    // First try to get draw IDs for this series
    try {
      const ids = await contract.getSeriesDrawIdsByIndex(seriesIndex);
      if (ids && ids.length > 0) {
        return ids.length;
      }
    } catch (idsError) {
      console.log("Could not get draw IDs, trying draw count method", idsError);
    }
    
    // If that fails, try to get the count directly
    const drawCount = await contract.getSeriesDrawCount(seriesIndex);
    return Number(drawCount);
  } catch (error) {
    // Log error but provide more user-friendly message
    console.log("Series " + seriesIndex + " draw count not available, using default", error);
    return 1; // Return 1 instead of 0 so we can show at least one draw
  }
};

// Format time remaining
export const formatTimeRemaining = (seconds: number): { days: number, hours: number, minutes: number, seconds: number } => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return { days, hours, minutes, seconds: remainingSeconds };
};
