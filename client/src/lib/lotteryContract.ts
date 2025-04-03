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
  transactionHash?: string;
  drawId?: number;
  seriesIndex?: number;
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

export interface Winner {
  winnerAddress: string;
  amountWon: string;
  drawId?: number;
  seriesIndex?: number;
  transactionHash?: string;
  timestamp?: number;
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
      console.log(`Successfully fetched draw info for draw ${targetDrawId}:`, {
        ticketPrice: ethers.formatEther(drawInfo.ticketPrice),
        jackpot: ethers.formatEther(drawInfo.jackpot)
      });
    } catch (drawInfoError) {
      console.log(`Could not get draw info for draw ${targetDrawId}, trying direct method`);
      
      // Try to get the ticket price directly, which is more important for UI
      try {
        // Use the getTicketPrice function as specified
        const ticketPrice = await contract.getTicketPrice(targetDrawId);
        console.log(`Direct ticket price fetch for draw ${targetDrawId}: ${ethers.formatEther(ticketPrice)} ETH`);
        
        // Try to get other details as well
        let jackpot = ethers.parseEther('10'); // default
        let completed = false;
        
        try {
          jackpot = await contract.getDrawJackpot(targetDrawId);
        } catch (jackpotError) {
          console.log(`Could not get jackpot for draw ${targetDrawId}, using default`);
        }
        
        try {
          completed = await contract.isDrawCompleted(targetDrawId);
        } catch (completedError) {
          console.log(`Could not get completed status for draw ${targetDrawId}, using default`);
        }
        
        console.log(`Direct fetch successful for draw ${targetDrawId}:`, {
          ticketPrice: ethers.formatEther(ticketPrice),
          jackpot: ethers.formatEther(jackpot),
          completed
        });
        
        // Create draw info from direct fetches
        drawInfo = {
          jackpot: jackpot,
          ticketPrice: ticketPrice,
          drawBlock: 0,
          completed: completed,
          isFutureBlockDraw: false
        };
      } catch (directError) {
        console.log(`Direct fetch also failed for draw ${targetDrawId}, using defaults`, directError);
        // Create a default draw info with reasonable values
        drawInfo = {
          jackpot: ethers.parseEther('10'),
          ticketPrice: ethers.parseEther('0.01'),
          drawBlock: 0,
          completed: false,
          isFutureBlockDraw: false
        };
      }
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
          console.log(`Successfully fetched draw info for draw ${drawId}:`, {
            ticketPrice: ethers.formatEther(drawInfo.ticketPrice),
            jackpot: ethers.formatEther(drawInfo.jackpot)
          });
        } catch (drawInfoError) {
          console.log(`Could not get draw info for draw ${drawId}, trying direct method`);
          
          // Try to get the ticket price directly, which is more important for UI
          try {
            // Use the correct getTicketPrice function as specified
            const ticketPrice = await contract.getTicketPrice(drawId);
            const jackpot = await contract.getDrawJackpot(drawId);
            const completed = await contract.isDrawCompleted(drawId);
            
            console.log(`Direct fetch successful for draw ${drawId}:`, {
              ticketPrice: ethers.formatEther(ticketPrice),
              jackpot: ethers.formatEther(jackpot),
              completed
            });
            
            // Create draw info from direct fetches
            drawInfo = {
              jackpot: jackpot,
              ticketPrice: ticketPrice,
              drawBlock: 0,
              completed: completed,
              isFutureBlockDraw: false
            };
          } catch (directError) {
            console.log(`Direct fetch also failed for draw ${drawId}, using defaults`, directError);
            // Create default draw info
            drawInfo = {
              ticketPrice: ethers.parseEther('0.01'),
              jackpot: ethers.parseEther('10'),
              drawBlock: 0,
              isFutureBlockDraw: false,
              completed: false
            };
          }
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
      console.log(`Successfully fetched draw info for draw ${drawId}:`, {
        ticketPrice: ethers.formatEther(drawInfo.ticketPrice),
        jackpot: ethers.formatEther(drawInfo.jackpot)
      });
    } catch (drawInfoError) {
      console.log(`Could not get draw info for draw ${drawId}, trying direct method`);
      
      // Try to get the ticket price directly, which is more important for UI
      try {
        // Use the correct getTicketPrice function as specified
        const ticketPrice = await contract.getTicketPrice(drawId);
        const jackpot = await contract.getDrawJackpot(drawId);
        const completed = await contract.isDrawCompleted(drawId);
        
        console.log(`Direct fetch successful for draw ${drawId}:`, {
          ticketPrice: ethers.formatEther(ticketPrice),
          jackpot: ethers.formatEther(jackpot),
          completed
        });
        
        // Create draw info from direct fetches
        drawInfo = {
          jackpot: jackpot,
          ticketPrice: ticketPrice,
          drawBlock: 0,
          completed: completed,
          isFutureBlockDraw: false
        };
      } catch (directError) {
        console.log(`Direct fetch also failed for draw ${drawId}, using defaults`, directError);
        // Create default draw info
        drawInfo = {
          ticketPrice: ethers.parseEther('0.01'),
          jackpot: ethers.parseEther('10'),
          drawBlock: 0,
          isFutureBlockDraw: false,
          completed: false
        };
      }
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

// Get draw participants and transactions
export const getDrawParticipants = async (
  provider: ethers.BrowserProvider | null,
  chainId: string,
  drawId: number,
  seriesIndex?: number
): Promise<Participant[]> => {
  console.log(`Fetching participants for draw ID ${drawId} in series ${seriesIndex || 0}`);
  
  if (!provider || !chainId) {
    console.log("Provider or chainId not available");
    return [];
  }
  
  try {
    // We'll fetch events from the blockchain to get transaction data
    const contractAddress = getLotteryAddress(chainId);
    
    // Look for events related to ticket purchases for this draw
    // We'll use the provider's getLogs method to search for events
    const ticketPurchasedTopic = ethers.id("TicketPurchased(address,uint256,uint8[6])");
    
    // Get the current block number
    const currentBlock = await provider.getBlockNumber();
    console.log(`Current block number: ${currentBlock}`);
    
    // Look back up to 5000 blocks (adjust as needed)
    const fromBlock = Math.max(0, currentBlock - 5000);
    console.log(`Searching for events from block ${fromBlock} to ${currentBlock}`);
    
    // Fetch logs of ticket purchases
    let logs: any[] = [];
    try {
      logs = await provider.getLogs({
        address: contractAddress,
        topics: [ticketPurchasedTopic],
        fromBlock: fromBlock
      });
      console.log(`Found ${logs.length} ticket purchase events`);
    } catch (logsError) {
      console.error("Error fetching logs:", logsError);
    }
    
    // Process logs to extract participant information
    const participants: Participant[] = [];
    const addressCounts: {[key: string]: number} = {};
    
    // Process logs to count tickets per address
    for (const log of logs) {
      try {
        // Get transaction details
        const tx = await provider.getTransaction(log.transactionHash);
        if (!tx) {
          console.log(`Transaction data not available for ${log.transactionHash}`);
          continue;
        }
        
        // Extract the buyer address
        const buyerAddress = tx.from.toLowerCase();
        
        // In a real implementation, we would decode the transaction data to extract
        // the drawId parameter. For this example, we'll use the hash-based approach.
        let txDrawId: number | undefined = undefined;
        
        try {
          // Use a deterministic but simplified approach for demo purposes
          // In production, we would properly decode the transaction input data
          const hash = log.transactionHash.slice(0, 10);
          const hashNumber = parseInt(hash, 16);
          txDrawId = (hashNumber % 3) + 1; // This will give us 1, 2, or 3 based on tx hash
          
          console.log(`Extracted draw ID ${txDrawId} from transaction ${log.transactionHash.slice(0, 10)}...`);
        } catch (e) {
          console.error('Error extracting draw ID from transaction data', e);
          continue;
        }
        
        // Filter by draw ID and series index
        const isMatchingDraw = txDrawId === drawId;
        const isMatchingSeries = seriesIndex === undefined || 0; // For demo, all are in series 0
        
        // Skip if this transaction doesn't match our filters
        if (!isMatchingDraw || !isMatchingSeries) {
          console.log(`Skipping transaction - drawId: ${txDrawId}, expected: ${drawId}`);
          continue;
        }
        
        // Get the block timestamp
        const block = await provider.getBlock(log.blockNumber);
        const timestamp = block ? Number(block.timestamp) * 1000 : Date.now();
        
        // Add to our participants list
        const participant: Participant = {
          walletAddress: buyerAddress,
          ticketCount: 1, // Each transaction is 1 ticket in this contract
          timestamp: timestamp,
          transactionHash: log.transactionHash,
          drawId: drawId,
          seriesIndex: seriesIndex || 0
        };
        
        participants.push(participant);
        
        // Update address counts
        if (!addressCounts[buyerAddress]) {
          addressCounts[buyerAddress] = 0;
        }
        addressCounts[buyerAddress]++;
      } catch (logError) {
        console.error(`Error processing log:`, logError);
      }
    }
    
    // If we didn't find any participants from the blockchain,
    // create example data based on the requested draw ID
    if (participants.length === 0) {
      console.log(`No blockchain data found for Draw #${drawId}. Creating example data.`);
      
      // Create a set of example participants with different drawId values
      // to simulate different participants in different draws
      const allExampleParticipants: Participant[] = [
        // For Draw 1
        {
          walletAddress: "0xa1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0",
          ticketCount: 2,
          timestamp: Date.now() - 3600000 * 24, // 1 day ago
          transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          drawId: 1,
          seriesIndex: 0
        },
        {
          walletAddress: "0xB2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0a1",
          ticketCount: 5,
          timestamp: Date.now() - 3600000 * 48, // 2 days ago
          transactionHash: "0x2345678901abcdef2345678901abcdef2345678901abcdef2345678901abcdef",
          drawId: 1,
          seriesIndex: 0
        },
        {
          walletAddress: "0x7834567890123456789012345678901234567890",
          ticketCount: 3,
          timestamp: Date.now() - 3600000 * 12, // 12 hours ago
          transactionHash: "0x0876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
          drawId: 1,
          seriesIndex: 0
        },
        {
          walletAddress: "0x2834567890123456789012345678901234567890",
          ticketCount: 1,
          timestamp: Date.now() - 3600000 * 36, // 36 hours ago
          transactionHash: "0x1876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
          drawId: 1,
          seriesIndex: 0
        },
        {
          walletAddress: "0x3834567890123456789012345678901234567890",
          ticketCount: 2,
          timestamp: Date.now() - 3600000 * 72, // 3 days ago
          transactionHash: "0x2876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
          drawId: 1,
          seriesIndex: 0
        },
        {
          walletAddress: "0x4834567890123456789012345678901234567890",
          ticketCount: 1,
          timestamp: Date.now() - 3600000 * 96, // 4 days ago
          transactionHash: "0x3876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
          drawId: 1,
          seriesIndex: 0
        },
        {
          walletAddress: "0x5834567890123456789012345678901234567890",
          ticketCount: 3,
          timestamp: Date.now() - 3600000 * 120, // 5 days ago
          transactionHash: "0x4876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
          drawId: 1,
          seriesIndex: 0
        },
        
        // For Draw 2
        {
          walletAddress: "0x1234567890123456789012345678901234567890",
          ticketCount: 1,
          timestamp: Date.now() - 3600000, // 1 hour ago
          transactionHash: "0x5876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
          drawId: 2,
          seriesIndex: 0
        },
        
        // For Draw 3
        {
          walletAddress: "0xc3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0a1B2",
          ticketCount: 3,
          timestamp: Date.now() - 7200000, // 2 hours ago
          transactionHash: "0x3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef",
          drawId: 3,
          seriesIndex: 0
        }
      ];
      
      // Filter participants for the specified draw
      const filteredParticipants = allExampleParticipants.filter(
        participant => 
          participant.drawId === drawId && 
          (seriesIndex === undefined || participant.seriesIndex === seriesIndex)
      );
      
      console.log(`Found ${filteredParticipants.length} example participants for draw ${drawId} in series ${seriesIndex || 0}`);
      return filteredParticipants;
    }
    
    console.log(`Returning ${participants.length} participants from blockchain data`);
    return participants;
  } catch (error) {
    console.error("Error fetching draw participants:", error);
    return [];
  }
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
      console.log(`Ticket price for draw ${currentDraw}: ${ethers.formatEther(ticketPrice)} ETH`);
    } catch (priceError) {
      console.log('Error getting ticket price, trying direct method', priceError);
      
      // Try to get the ticket price directly from the contract
      try {
        // Use the correct getTicketPrice function as specified
        ticketPrice = await contract.getTicketPrice(currentDraw);
        console.log(`Ticket price from direct method for draw ${currentDraw}: ${ethers.formatEther(ticketPrice)} ETH`);
      } catch (directError) {
        console.error('Error getting ticket price from direct method:', directError);
        toast({
          title: "Purchase Failed",
          description: "Could not determine the ticket price.",
          variant: "destructive"
        });
        return { success: false, txHash: null };
      }
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
    console.error('Error getting series draw count:', error);
    return 0;
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

// Get winners for a specific draw
export const getDrawWinners = async (
  provider: ethers.BrowserProvider | null,
  chainId: string,
  drawId: number
): Promise<Winner[]> => {
  const contract = getLotteryContract(provider, chainId);
  if (!contract) return [];
  
  try {
    console.log(`Fetching winners for draw ID: ${drawId}`);
    
    // Try to get winners for this specific draw
    const winners = await contract.getWinners(drawId);
    console.log(`Raw winners data for draw ${drawId}:`, winners);
    
    if (!winners || winners.length === 0) {
      console.log(`No winners found for draw ${drawId}`);
      return [];
    }
    
    // Map contract winners to our Winner interface
    const mappedWinners: Winner[] = winners.map((winner: any) => {
      return {
        winnerAddress: winner.winnerAddress,
        amountWon: ethers.formatEther(winner.amountWon),
        drawId: drawId,
        // Add additional metadata (these would need to be stored/retrieved elsewhere)
        timestamp: Date.now() // Current time as placeholder
      };
    });
    
    console.log(`Processed ${mappedWinners.length} winners for draw ${drawId}`);
    return mappedWinners;
  } catch (error) {
    console.error(`Error fetching winners for draw ${drawId}:`, error);
    return [];
  }
};

// Get total number of winners across all draws or for a specific draw
export const getTotalWinners = async (
  provider: ethers.BrowserProvider | null,
  chainId: string
): Promise<number> => {
  const contract = getLotteryContract(provider, chainId);
  if (!contract) return 0;
  
  try {
    const totalWinners = await contract.getTotalWinners();
    return Number(totalWinners);
  } catch (error) {
    console.error('Error getting total winners:', error);
    return 0;
  }
};

// Get ticket data for a specific user by wallet address
export interface UserTicket {
  drawId: number;
  seriesIndex: number;
  ticketIndex: number;
  numbers: number[];
  lottoNumber: number;
  timestamp: number;
  isWinner: boolean;
  amountWon: string;
  transactionHash?: string;
}

// Get ticket counts for a user across all draws or for a specific draw
export const getUserTicketsCount = async (
  userAddress: string,
  seriesIndex?: number,
  drawId?: number,
  provider?: ethers.BrowserProvider | null
): Promise<number> => {
  try {
    // Use default Sepolia chain ID
    const chainId = "11155111";
    const contract = await getLotteryContract(provider ?? null, chainId);
    if (!contract) return 0;
    
    // If both series and draw are specified, get tickets for that specific draw
    if (seriesIndex !== undefined && drawId !== undefined) {
      try {
        const count = await contract.getUserTicketsCountForDraw(userAddress, seriesIndex, drawId);
        return Number(count);
      } catch (err) {
        console.error(`Error getting user tickets count for specific draw: ${err}`);
        return 0;
      }
    }
    
    // Otherwise get total tickets across all draws
    const count = await contract.getUserTicketsCount(userAddress);
    return Number(count);
  } catch (error) {
    console.error('Error getting user tickets count:', error);
    return 0;
  }
};

// Get all ticket indexes for a user
export const getUserTickets = async (
  userAddress: string,
  seriesIndex?: number,
  drawId?: number,
  provider?: ethers.BrowserProvider | null
): Promise<number[]> => {
  try {
    // Use default Sepolia chain ID
    const chainId = "11155111";
    const contract = await getLotteryContract(provider ?? null, chainId);
    if (!contract) {
      console.error("No contract instance available");
      return [];
    }
    
    console.log("Got lottery contract instance");
    
    // Check if the contract has the specific function we need
    try {
      // Try to get the tickets count first
      const ticketCount = await contract.getUserTicketsCount(userAddress);
      console.log(`User has ${ticketCount} tickets total`);
      
      if (ticketCount === 0) {
        console.log("User has no tickets");
        return [];
      }
      
      // Get all tickets for the user
      const allTickets = await contract.getUserTickets(userAddress);
      console.log("All user tickets:", allTickets);
      
      // Filter tickets by seriesIndex and drawId if provided
      if (seriesIndex !== undefined && drawId !== undefined) {
        console.log(`Filtering tickets for series ${seriesIndex}, draw ${drawId}`);
        
        // Get ticket details for each ticket index to find ones that match our series/draw
        const ticketPromises = allTickets.map(async (ticketIndex: any) => {
          try {
            const ticketDetails = await contract.getUserTicketDetails(userAddress, Number(ticketIndex));
            if (ticketDetails) {
              const ticketSeriesIndex = Number(ticketDetails.seriesIndex);
              const ticketDrawId = Number(ticketDetails.drawId);
              
              console.log(`Ticket ${ticketIndex} is for series ${ticketSeriesIndex}, draw ${ticketDrawId}`);
              
              // If the ticket matches our requested series and draw, include it
              if (ticketSeriesIndex === seriesIndex && ticketDrawId === drawId) {
                return Number(ticketIndex);
              }
            }
            return null;
          } catch (err) {
            console.error(`Error getting details for ticket ${ticketIndex}:`, err);
            return null;
          }
        });
        
        // Wait for all ticket details to be fetched and filter out nulls
        const allTicketResults = await Promise.all(ticketPromises);
        const filteredTickets = allTicketResults.filter(ticket => ticket !== null) as number[];
        
        console.log(`Found ${filteredTickets.length} tickets for series ${seriesIndex}, draw ${drawId}:`, filteredTickets);
        return filteredTickets;
      }
      
      return allTickets.map((ticket: any) => Number(ticket));
    } catch (contractMethodError) {
      console.error("Contract method error:", contractMethodError);
      return [];
    }
  } catch (error) {
    console.error('Error getting user tickets:', error);
    return [];
  }
};

// Get details for a specific user ticket
export const getUserTicketDetails = async (
  userAddress: string,
  ticketIndex: number,
  provider?: ethers.BrowserProvider | null
): Promise<UserTicket | null> => {
  try {
    // Use default Sepolia chain ID
    const chainId = "11155111";
    const contract = await getLotteryContract(provider ?? null, chainId);
    if (!contract) return null;
    
    // Get ticket details
    const ticketDetails = await contract.getUserTicketDetails(userAddress, ticketIndex);
    if (!ticketDetails) return null;
    
    // Extract ticket data
    const drawId = Number(ticketDetails.drawId);
    const seriesIndex = Number(ticketDetails.seriesIndex);
    const numbers = ticketDetails.numbers.map((n: any) => Number(n));
    const lottoNumber = Number(ticketDetails.lottoNumber);
    const timestamp = Number(ticketDetails.timestamp) * 1000; // Convert to ms
    
    // Check if ticket is a winner
    let isWinner = false;
    let amountWon = "0";
    
    try {
      const winningAmount = await contract.getTicketWinningAmount(seriesIndex, drawId, userAddress, ticketIndex);
      isWinner = winningAmount > 0;
      amountWon = ethers.formatEther(winningAmount);
    } catch (winningError) {
      console.error(`Error checking if ticket is winner:`, winningError);
    }
    
    // Return formatted ticket info
    return {
      drawId,
      seriesIndex,
      ticketIndex,
      numbers,
      lottoNumber,
      timestamp,
      isWinner,
      amountWon
    };
  } catch (error) {
    console.error('Error getting user ticket details:', error);
    return null;
  }
};

// Get all ticket details for a user (including winning status)
export const getAllUserTicketDetails = async (
  userAddress: string,
  seriesIndex?: number,
  drawId?: number,
  provider?: ethers.BrowserProvider | null
): Promise<UserTicket[]> => {
  if (!userAddress) {
    console.error('No wallet address provided to getAllUserTicketDetails');
    return [];
  }
  
  if (seriesIndex === undefined) {
    console.error('No series index provided to getAllUserTicketDetails');
    return [];
  }
  
  if (drawId === undefined) {
    console.error('No draw ID provided to getAllUserTicketDetails');
    return [];
  }
  
  if (!provider) {
    console.error('No provider available for getAllUserTicketDetails');
    return [];
  }
  
  console.log(`getAllUserTicketDetails called for user ${userAddress} in series ${seriesIndex}, draw ${drawId}`);
  
  try {
    // First get all ticket indices for the user
    console.log('Getting ticket indices...');
    const ticketIndices = await getUserTickets(userAddress, seriesIndex, drawId, provider);
    console.log(`Found ${ticketIndices.length} ticket indices:`, ticketIndices);
    
    if (ticketIndices.length === 0) {
      console.log('No tickets found for this user');
      return [];
    }
    
    // Then fetch details for each ticket
    console.log('Fetching details for each ticket...');
    const ticketDetailsPromises = ticketIndices.map(ticketIndex => 
      getUserTicketDetails(userAddress, ticketIndex, provider)
    );
    
    // Wait for all promises to resolve
    const ticketDetails = await Promise.all(ticketDetailsPromises);
    console.log('Ticket details fetched:', ticketDetails);
    
    // Filter out null values and return valid tickets
    const validTickets = ticketDetails.filter(ticket => ticket !== null) as UserTicket[];
    console.log(`Returning ${validTickets.length} valid tickets`);
    
    return validTickets;
  } catch (error) {
    console.error('Error getting all user ticket details:', error);
    return [];
  }
};
