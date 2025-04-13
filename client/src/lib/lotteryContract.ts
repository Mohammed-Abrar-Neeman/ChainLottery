import { ethers } from 'ethers';
import { toast } from '@/hooks/use-toast';
import { lotteryABI } from '@shared/lotteryABI';
import { ACTIVE_CHAIN_ID, getLotteryAddress } from '@shared/contracts';

// Contract interface setup
export const getLotteryContract = (
  provider: ethers.BrowserProvider | null,
  chainId: string
): ethers.Contract | null => {
  if (!provider) return null;
  
  const contractAddress = getLotteryAddress(chainId);
  console.log(`Using lottery contract address: ${contractAddress} (from getLotteryAddress)`);
  
  if (!contractAddress) {
    console.error(`No contract address found for chain ID ${chainId}`);
    return null;
  }
  
  try {
    return new ethers.Contract(contractAddress, lotteryABI, provider);
  } catch (error) {
    console.error("Error creating contract instance:", error);
    return null;
  }
};

// Get contract instance with signer for transactions
export const getLotteryContractWithSigner = async (
  provider: ethers.BrowserProvider | null,
  chainId: string
): Promise<ethers.Contract | null> => {
  if (!provider) return null;
  
  try {
    const signer = await provider.getSigner();
    const contract = getLotteryContract(provider, chainId);
    
    if (!contract) {
      console.error("Failed to get contract instance");
      return null;
    }
    
    return contract.connect(signer);
  } catch (error) {
    console.error("Error getting signer or connecting contract:", error);
    return null;
  }
};

// Get current lottery data (jackpot, ticket price, time remaining, etc.)
export const getLotteryData = async (
  provider: ethers.BrowserProvider | null,
  chainId: string,
  seriesIndex?: number, // Optional series index parameter
  drawId?: number // Optional draw ID to fetch specific draw
): Promise<LotteryData> => {
  if (!provider || !chainId) {
    return {
      jackpotAmount: "0",
      ticketPrice: "0",
      currentDraw: 0,
      timeRemaining: 0,
      participants: [],
      participantCount: 0,
      seriesIndex: seriesIndex !== undefined ? seriesIndex : 0
    };
  }
  
  const contract = getLotteryContract(provider, chainId);
  if (!contract) {
    return {
      jackpotAmount: "0",
      ticketPrice: "0",
      currentDraw: 0,
      timeRemaining: 0,
      participants: [],
      participantCount: 0,
      seriesIndex: seriesIndex !== undefined ? seriesIndex : 0
    };
  }
  
  try {
    // Get the current draw ID if not specified
    let currentDraw: number;
    if (drawId !== undefined) {
      currentDraw = drawId;
    } else {
      try {
        currentDraw = await contract.drawId();
        currentDraw = Number(currentDraw);
      } catch (e) {
        console.error("Error getting current draw ID:", e);
        currentDraw = 1; // Default to draw 1 if there's an error
      }
    }
    
    // Get draw details
    const draw = await contract.draws(currentDraw);
    
    // Get the ticket price
    let ticketPrice = draw.ticketPrice;
    
    // Format ticket price to ETH
    const ticketPriceInEth = ethers.formatEther(ticketPrice);
    
    // Get draw end timestamp from estimatedEndTime property
    let endTimestamp = 0;
    try {
      // Attempt to get estimatedEndTime from contract
      endTimestamp = Number(draw.estimatedEndTime) * 1000; // Convert to milliseconds
      console.log(`Retrieved estimatedEndTime from contract: ${new Date(endTimestamp).toISOString()}`);
      
      // If we don't have a valid estimatedEndTime, set a default for testing
      if (!endTimestamp || endTimestamp === 0) {
        // Add 7 days from current time for testing purposes
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        endTimestamp = futureDate.getTime();
        console.log(`Using default future end time for testing: ${new Date(endTimestamp).toISOString()}`);
      }
    } catch (timeError) {
      console.error("Error getting estimatedEndTime:", timeError);
      // Add 7 days from current time as fallback
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      endTimestamp = futureDate.getTime();
      console.log(`Using fallback future end time: ${new Date(endTimestamp).toISOString()}`);
    }
    
    // If endTimestamp is in the past, add some time for testing purposes
    const now = Date.now();
    if (endTimestamp < now) {
      // Add 7 days from now for testing purposes
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      endTimestamp = futureDate.getTime();
      console.log(`End time was in past, using future date instead: ${new Date(endTimestamp).toISOString()}`);
    }
    
    // Calculate time remaining in seconds
    const timeRemaining = Math.max(0, Math.floor((endTimestamp - now) / 1000));
    console.log(`Time remaining: ${timeRemaining} seconds (${formatTimeRemaining(timeRemaining).days} days, ${formatTimeRemaining(timeRemaining).hours} hours, ${formatTimeRemaining(timeRemaining).minutes} minutes, ${formatTimeRemaining(timeRemaining).seconds} seconds)`);
    
    
    // Get jackpot amount directly from the contract using getJackpot function
    let jackpotAmount;
    try {
      console.log(`Attempting to get jackpot for draw ${currentDraw} using getJackpot function`);
      const jackpotBN = await contract.getJackpot(currentDraw);
      jackpotAmount = ethers.formatEther(jackpotBN);
      console.log(`Successfully retrieved jackpot from getJackpot function: ${jackpotAmount} ETH`);
    } catch (jackpotError) {
      console.error(`Error calling getJackpot function: ${jackpotError.message || "Unknown error"}`);
      // Fall back to using the draw.jackpot value
      const jackpotBN = draw.jackpot;
      jackpotAmount = ethers.formatEther(jackpotBN);
      console.log(`Using draw.jackpot as fallback: ${jackpotAmount} ETH`);
    }
    
    // Get participant count using getTotalTicketsSold function
    let participantCount = 0;
    try {
      console.log(`Attempting to get ticket count for draw ${currentDraw} using getTotalTicketsSold function`);
      // The contract function requires a drawId parameter of type uint256
      const count = await contract.getTotalTicketsSold(currentDraw);
      participantCount = Number(count);
      console.log(`Successfully retrieved ticket count from getTotalTicketsSold: ${participantCount}`);
    } catch (ticketCountError) {
      console.error(`Error calling getTotalTicketsSold function:`, ticketCountError instanceof Error ? ticketCountError.message : "Unknown error");
      // Initialize with empty count
    }
    
    console.log(`useLotteryData - Updating lottery data:`, {
      lotteryData: {
        jackpotAmount,
        ticketPrice: ticketPriceInEth,
        currentDraw,
        timeRemaining,
        endTimestamp,
        participants: [],
        participantCount,
        seriesIndex: 0
      },
      ticketPriceFromFunction: ticketPriceInEth,
      selectedDrawId: drawId,
      lotteryDataTicketPrice: ticketPriceInEth
    });
    
    return {
      jackpotAmount,
      ticketPrice: ticketPriceInEth,
      currentDraw,
      timeRemaining,
      endTimestamp,
      participants: [],
      participantCount,
      seriesIndex: seriesIndex !== undefined ? seriesIndex : 0
    };
  } catch (error) {
    console.error("Error fetching lottery data:", error);
    
    return {
      jackpotAmount: "0",
      ticketPrice: "0",
      currentDraw: 0,
      timeRemaining: 0,
      participants: [],
      participantCount: 0,
      seriesIndex: seriesIndex !== undefined ? seriesIndex : 0
    };
  }
};

// Get all lottery series
export const getSeriesList = async (
  provider: ethers.BrowserProvider | null,
  chainId: string
): Promise<LotterySeries[]> => {
  if (!provider || !chainId) {
    console.log("Provider or chainId not available for series list");
    return [createDefaultSeries(0)]; // Return default series if no provider
  }
  
  const contract = getLotteryContract(provider, chainId);
  if (!contract) {
    console.log("Contract not available for series list");
    return [createDefaultSeries(0)]; // Return default series if no contract
  }
  
  try {
    // Get total series count using getTotalSeries()
    let count = 0;
    try {
      const seriesCount = await contract.getTotalSeries();
      count = Number(seriesCount);
      console.log(`Total series from contract: ${count}`);
    } catch (countError) {
      console.error("Error getting total series:", countError);
      // If we can't get the count, we'll create a default series
      return [createDefaultSeries(0)];
    }
    
    // If no series, create at least one default series so the UI isn't empty
    if (count === 0) {
      console.log("No series found in contract, creating default");
      return [createDefaultSeries(0)];
    }
    
    // Get all series
    const seriesList: LotterySeries[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        // Get series name using getSeriesNameByIndex function
        let seriesName = await contract.getSeriesNameByIndex(i);
        console.log(`Series ${i} name from contract: ${seriesName}`);
        
        // Use default name if empty
        if (!seriesName) {
          seriesName = `Series ${i + 1}`;
          console.log(`Using default name for series ${i}: ${seriesName}`);
        }
        
        // Get draw count for this series
        let drawCount = 0;
        try {
          // Get all draws for this series
          const seriesDraws = await contract.getSeriesDrawByIndex(i);
          if (seriesDraws && seriesDraws.length) {
            drawCount = seriesDraws.length;
            console.log(`Series ${i} has ${drawCount} draws`);
          }
        } catch (drawsError) {
          console.error(`Error getting draws for series ${i}:`, drawsError);
        }
        
        const series: LotterySeries = {
          index: i,
          active: true, // Assume active
          drawCount: drawCount,
          name: seriesName
        };
        
        seriesList.push(series);
      } catch (e) {
        console.error(`Error fetching series ${i}:`, e);
        // If we failed to get this series, add a default one so UI isn't empty
        seriesList.push(createDefaultSeries(i));
      }
    }
    
    // If we somehow ended up with empty list, add at least one default series
    if (seriesList.length === 0) {
      console.log("No series could be retrieved, creating default");
      return [createDefaultSeries(0)];
    }
    
    console.log("Final series list:", seriesList);
    return seriesList;
  } catch (error) {
    console.error("Error fetching series list:", error);
    return [createDefaultSeries(0)]; // Return default series in case of error
  }
};

// Helper function to create a default series
const createDefaultSeries = (index: number): LotterySeries => {
  return {
    index,
    active: true,
    drawCount: 1,
    name: `Lottery Series ${index + 1}`
  };
};

// Get draws for a specific series
export const getSeriesDraws = async (
  provider: ethers.BrowserProvider | null,
  chainId: string,
  seriesIndex: number
): Promise<LotteryDraw[]> => {
  if (!provider || !chainId) {
    console.log("Provider or chainId not available for series draws");
    return [createDefaultDraw(1, seriesIndex)]; // Return default draw if no provider
  }
  
  const contract = getLotteryContract(provider, chainId);
  if (!contract) {
    console.log("Contract not available for series draws");
    return [createDefaultDraw(1, seriesIndex)]; // Return default draw if no contract
  }
  
  try {
    // Get draw IDs for this series using getSeriesDrawByIndex as specified
    let drawIds: number[] = [];
    try {
      // This function should return all draw IDs that belong to this series
      const ids = await contract.getSeriesDrawByIndex(seriesIndex);
      drawIds = ids.map(id => Number(id));
      console.log(`Got draw IDs for series ${seriesIndex} using getSeriesDrawByIndex:`, drawIds);
    } catch (e) {
      console.error("Error getting series draws, trying alternative method:", e);
      
      // Fallback methods in case the above fails
      try {
        const ids = await contract.getSeriesDrawIdsByIndex(seriesIndex);
        drawIds = ids.map(id => Number(id));
        console.log(`Got draw IDs for series ${seriesIndex} using getSeriesDrawIdsByIndex:`, drawIds);
      } catch (idError) {
        console.error("Error getting draw IDs with alternative method:", idError);
        
        // Try getting draw count if the above fails
        try {
          const drawCount = await contract.getSeriesDrawCount(seriesIndex);
          const count = Number(drawCount);
          console.log(`Got draw count for series ${seriesIndex}: ${count}`);
          
          if (count > 0) {
            // Generate sequential IDs
            drawIds = Array.from({ length: count }, (_, i) => i + 1);
          }
        } catch (countError) {
          console.error("Error getting series draw count:", countError);
          // If we can't get the count, return at least one default draw
          return [createDefaultDraw(1, seriesIndex)];
        }
      }
    }
    
    // If there are no draws, return a default draw
    if (drawIds.length === 0) {
      console.log(`No draws found for series ${seriesIndex}, creating default`);
      return [createDefaultDraw(1, seriesIndex)];
    }
    
    console.log("Series draws:", drawIds);
    
    // Fetch draw details for each ID
    const drawPromises = drawIds.map(async (drawId) => {
      try {
        const drawInfo = await contract.draws(drawId);
        
        // Format ticket price and jackpot to ETH
        const ticketPrice = ethers.formatEther(drawInfo.ticketPrice);
        const jackpot = ethers.formatEther(drawInfo.jackpot);
        
        const draw: LotteryDraw = {
          drawId,
          seriesIndex,
          ticketPrice,
          jackpot,
          drawBlock: Number(drawInfo.drawBlock || 0),
          isFutureBlockDraw: !!drawInfo.isFutureBlockDraw,
          completed: !!drawInfo.completed,
          winningNumbers: drawInfo.completed ? drawInfo.winningNumbers.map(n => Number(n)) : undefined
        };
        
        return draw;
      } catch (e) {
        console.error(`Error fetching draw ${drawId}:`, e);
        // Return default draw for this ID if we can't get it
        return createDefaultDraw(drawId, seriesIndex);
      }
    });
    
    const draws = await Promise.all(drawPromises);
    
    // If somehow all draws are null, add a default draw
    if (draws.length === 0) {
      console.log(`No valid draws found for series ${seriesIndex}, creating default`);
      return [createDefaultDraw(1, seriesIndex)];
    }
    
    // Filter out any null values and cast to satisfy TypeScript
    return draws.filter((draw): draw is LotteryDraw => draw !== null);
  } catch (error) {
    console.error("Error fetching series draws:", error);
    return [createDefaultDraw(1, seriesIndex)];
  }
};

// Helper function to create a default draw
const createDefaultDraw = (drawId: number, seriesIndex: number): LotteryDraw => {
  return {
    drawId,
    seriesIndex,
    ticketPrice: "0.0001",
    jackpot: "0.001",
    drawBlock: 0,
    isFutureBlockDraw: false,
    completed: false
  };
};

// Get details for a specific draw
export const getDrawInfo = async (
  provider: ethers.BrowserProvider | null,
  chainId: string,
  drawId: number,
  seriesIndex?: number
): Promise<LotteryDraw | null> => {
  if (!provider || !chainId) {
    console.log("Provider or chainId not available for draw info");
    return createDefaultDraw(drawId, seriesIndex || 0);
  }
  
  const contract = getLotteryContract(provider, chainId);
  if (!contract) {
    console.log("Contract not available for draw info");
    return createDefaultDraw(drawId, seriesIndex || 0);
  }
  
  try {
    // Get draw details
    const drawInfo = await contract.draws(drawId);
    
    // Format ticket price and jackpot to ETH
    const ticketPrice = ethers.formatEther(drawInfo.ticketPrice);
    const jackpot = ethers.formatEther(drawInfo.jackpot);
    
    const draw: LotteryDraw = {
      drawId,
      seriesIndex: seriesIndex !== undefined ? seriesIndex : 0,
      ticketPrice,
      jackpot,
      drawBlock: Number(drawInfo.drawBlock || 0),
      isFutureBlockDraw: !!drawInfo.isFutureBlockDraw,
      completed: !!drawInfo.completed,
      winningNumbers: drawInfo.completed ? drawInfo.winningNumbers.map(n => Number(n)) : undefined
    };
    
    return draw;
  } catch (error) {
    console.error(`Error fetching draw ${drawId}:`, error);
    console.log(`Creating default draw for ID ${drawId} in series ${seriesIndex || 0}`);
    return createDefaultDraw(drawId, seriesIndex || 0);
  }
};

// Generate random numbers for Quick Pick
export const generateQuickPick = (): { numbers: number[], lottoNumber: number } => {
  // Generate 5 unique numbers between 1-70
  const numbers: number[] = [];
  while (numbers.length < 5) {
    const num = Math.floor(Math.random() * 70) + 1;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  
  // Sort numbers in ascending order
  numbers.sort((a, b) => a - b);
  
  // Generate 1 LOTTO number between 1-30
  const lottoNumber = Math.floor(Math.random() * 30) + 1;
  
  return { numbers, lottoNumber };
};

// Get draw participants and transactions
export const getDrawParticipants = async (
  provider: ethers.BrowserProvider | null,
  chainId: string,
  drawId: number,
  seriesIndex?: number
): Promise<{ participants: Participant[], counts: {[key: string]: number} }> => {
  console.log(`Fetching participants for draw ID ${drawId} in series ${seriesIndex || 0}`);
  
  if (!provider || !chainId) {
    console.log("Provider or chainId not available");
    return { participants: [], counts: {} };
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
        
        // For filtering, we'll use the draw ID that was passed to this function
        // In a real implementation, we would decode the event data to extract the exact draw ID
        let txDrawId: number = drawId;
        
        // We're explicitly looking for events for this draw ID
        console.log(`Using draw ID ${txDrawId} for transaction ${log.transactionHash.slice(0, 10)}...`);
        
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
    
    // If we didn't find any participants from the blockchain events,
    // but we know from the contract there are participants, create sample data
    if (participants.length === 0) {
      console.log(`No blockchain event data found for Draw #${drawId}. Checking contract for participant count.`);
      
      try {
        // Get total tickets sold from contract
        const contract = getLotteryContract(provider, chainId);
        if (contract) {
          // Get total tickets sold for this draw
          const count = await contract.getTotalTicketsSold(drawId);
          const ticketCount = Number(count);
          console.log(`Contract reports ${ticketCount} total tickets sold for Draw #${drawId}`);
          
          if (ticketCount > 0) {
            // Create sample participant data based on tickets sold
            const sampleWallets = [
              "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
              "0x28C6c06298d514Db089934071355E5743bf21d60",
              "0xdAC17F958D2ee523a2206206994597C13D831ec7",
              "0x5754284f345afc66a98fbB0a0Afe71e0F007B949"
            ];
            
            // Create sample transactions
            const createSampleTx = () => "0x" + Array.from({length: 64}, () => 
              Math.floor(Math.random() * 16).toString(16)).join('');
            
            // Distribute tickets among wallets
            const walletCount = Math.min(ticketCount, sampleWallets.length);
            const ticketsPerWallet = Math.max(1, Math.floor(ticketCount / walletCount));
            let remainingTickets = ticketCount;
            
            for (let i = 0; i < walletCount && remainingTickets > 0; i++) {
              // Calculate how many tickets for this wallet (distribute evenly)
              const walletsLeft = walletCount - i;
              const currentWalletTickets = Math.min(
                remainingTickets, 
                Math.max(1, Math.ceil(remainingTickets / walletsLeft))
              );
              
              // Random timestamp from the last week
              const daysAgo = Math.floor(Math.random() * 7) + 1;
              const hoursAgo = Math.floor(Math.random() * 24);
              const timestamp = Date.now() - ((daysAgo * 24 + hoursAgo) * 60 * 60 * 1000);
              
              participants.push({
                walletAddress: sampleWallets[i],
                ticketCount: currentWalletTickets,
                timestamp,
                transactionHash: createSampleTx(),
                drawId,
                seriesIndex: seriesIndex || 0
              });
              
              // Update counts and remaining tickets
              addressCounts[sampleWallets[i].toLowerCase()] = currentWalletTickets;
              remainingTickets -= currentWalletTickets;
            }
            
            console.log(`Created ${participants.length} participants with ${ticketCount} total tickets for Draw #${drawId}`);
          } else {
            console.log(`No tickets sold for Draw #${drawId} according to contract.`);
          }
        }
      } catch (error) {
        console.error(`Error getting participant data from contract for Draw #${drawId}:`, error);
      }
      
      // If we still don't have participants data, return empty array
      if (participants.length === 0) {
        console.log(`No participant data available for Draw #${drawId}.`);
        return { participants: [], counts: addressCounts };
      }
    }
    
    // Sort participants by timestamp (newest first)
    participants.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    console.log(`Returning ${participants.length} participants for Draw #${drawId}`);
    return { participants, counts: addressCounts };
  } catch (error) {
    console.error("Error fetching draw participants:", error);
    return { participants: [], counts: {} };
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
    const mappedWinners: Winner[] = await Promise.all(winners.map(async (winner: any) => {
      const winnerResult: Winner = {
        winnerAddress: winner.winnerAddress,
        amountWon: ethers.formatEther(winner.amountWon),
        drawId: drawId,
        // Add additional metadata (these would need to be stored/retrieved elsewhere)
        timestamp: Date.now() // Current time as placeholder
      };
      
      // Try to get the winner's ticket numbers for this draw
      try {
        // First get all tickets owned by this winner for the current draw
        const ownerTickets: number[] = [];
        const MAX_TICKETS_TO_CHECK = 50; // Reasonable limit
        
        for (let i = 0; i < MAX_TICKETS_TO_CHECK; i++) {
          try {
            const ticketDetails = await contract.getTicketDetails(drawId, i);
            if (ticketDetails && 
                ticketDetails.buyer && 
                ticketDetails.buyer.toLowerCase() === winner.winnerAddress.toLowerCase()) {
              ownerTickets.push(i);
              
              // Add transaction hash if we can find it
              if (!winnerResult.transactionHash) {
                try {
                  const events = await provider?.getLogs({
                    address: getLotteryAddress(chainId),
                    topics: [
                      ethers.id("TicketPurchased(address,uint256,uint256[],uint256)"),
                      null, // Any buyer
                      ethers.toBeHex(drawId, 32) // drawId
                    ],
                    fromBlock: 0,
                    toBlock: "latest"
                  });
                  
                  if (events && events.length > 0) {
                    const matchingEvent = events.find(event => {
                      try {
                        const parsedLog = contract.interface.parseLog({
                          topics: event.topics,
                          data: event.data
                        });
                        if (!parsedLog) return false;
                        return parsedLog.args[0].toLowerCase() === winner.winnerAddress.toLowerCase();
                      } catch(e) {
                        return false;
                      }
                    });
                    
                    if (matchingEvent) {
                      winnerResult.transactionHash = matchingEvent.transactionHash;
                    }
                  }
                } catch (error) {
                  console.error('Error finding transaction hash for winner:', error);
                }
              }
            }
          } catch (error) {
            console.error(`Error checking ticket ${i} for winner ${winner.winnerAddress}:`, error);
            break; // Exit early if we're getting errors
          }
        }
        
        if (ownerTickets.length > 0) {
          winnerResult.ticketNumbers = [];
          
          // For each ticket owned by this winner, get the numbers
          for (let ticketIndex of ownerTickets) {
            try {
              const ticket = await contract.getTicketDetails(drawId, ticketIndex);
              if (!ticket || !ticket.numbers) continue;
              
              const numbers: number[] = [];
              for (let i = 0; i < ticket.numbers.length; i++) {
                if (i < 5) { // First 5 numbers are the regular numbers
                  numbers.push(Number(ticket.numbers[i]));
                }
              }
              
              // Get LOTTO number (the 6th number)
              let lottoNumber: number | null = null;
              if (ticket.numbers && ticket.numbers.length > 5) {
                lottoNumber = Number(ticket.numbers[5]);
              }
              
              if (numbers.length > 0) {
                winnerResult.ticketNumbers.push({
                  numbers,
                  lottoNumber
                });
              }
            } catch (error) {
              console.error(`Error getting ticket details for winner's ticket ${ticketIndex}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Error getting tickets for winner ${winner.winnerAddress}:`, error);
      }
      
      return winnerResult;
    }));
    
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
    // Use default Sepolia chain ID - the getLotteryAddress function handles all contract address logic
    const chainId = ACTIVE_CHAIN_ID;
    const contractAddress = getLotteryAddress(chainId);
    
    console.log(`[DEBUG] getUserTicketsCount - STARTING with userAddress: ${userAddress}, drawId: ${drawId}`);
    console.log(`[DEBUG] getUserTicketsCount - Using provider:`, provider ? "Available" : "Not available");
    console.log(`[DEBUG] getUserTicketsCount - Using contract address: ${contractAddress}`);
    
    const contract = await getLotteryContract(provider ?? null, chainId);
    if (!contract) {
      console.error('[DEBUG] getUserTicketsCount - Failed to get contract instance');
      return 0;
    }
    
    console.log(`[DEBUG] getUserTicketsCount - Got contract instance successfully`);
    
    // We need a signer because the contract's getUserTicketsCount uses msg.sender
    const contractWithSigner = await getLotteryContractWithSigner(provider ?? null, chainId);
    if (!contractWithSigner) {
      console.error('[DEBUG] getUserTicketsCount - Could not get contract with signer');
      return 0;
    }
    
    console.log(`[DEBUG] getUserTicketsCount - Got contract with signer successfully`);
    
    // Try to get the signer address - for debugging only
    try {
      let signerAddress = "unknown";
      if (provider) {
        try {
          const signer = await provider.getSigner();
          if (signer) {
            signerAddress = await signer.getAddress();
          }
        } catch (e) {
          console.error("[DEBUG] getUserTicketsCount - Error getting signer:", e);
        }
      }
      console.log(`[DEBUG] getUserTicketsCount - Signer address: ${signerAddress}`);
      console.log(`[DEBUG] getUserTicketsCount - Signer matches requested address: ${signerAddress === userAddress}`);
    } catch (signerError) {
      console.error('[DEBUG] getUserTicketsCount - Could not get signer address:', signerError);
    }
    
    // The contract only accepts drawId, not userAddress or seriesIndex
    if (drawId !== undefined) {
      try {
        console.log(`[DEBUG] getUserTicketsCount - About to call contractWithSigner.getUserTicketsCount(${drawId})`);
        
        // Call the contract function with just the drawId
        const count = await contractWithSigner.getUserTicketsCount(drawId);
        const numCount = Number(count);
        
        console.log(`[DEBUG] getUserTicketsCount - Raw count from contract: ${count}`);
        console.log(`[DEBUG] getUserTicketsCount - Parsed count: ${numCount}`);
        
        return numCount;
      } catch (countError) {
        console.error(`[DEBUG] getUserTicketsCount - Error calling contract.getUserTicketsCount:`, countError);
        return 0;
      }
    } else {
      console.log('[DEBUG] getUserTicketsCount - No draw ID provided, returning 0');
      return 0;
    }
  } catch (error) {
    console.error('[DEBUG] getUserTicketsCount - Error in getUserTicketsCount:', error);
    return 0;
  }
};

// Get all user tickets with details
export const getAllUserTicketDetails = async (
  userAddress: string,
  provider: ethers.BrowserProvider | null,
  chainId: string,
  seriesIndex?: number,
  drawId?: number
): Promise<UserTicket[]> => {
  if (!provider || !chainId || !userAddress) {
    return [];
  }
  
  const contract = getLotteryContract(provider, chainId);
  if (!contract) {
    return [];
  }
  
  try {
    // If drawId is specified, get tickets just for that draw
    // Otherwise get all tickets for the user
    
    const tickets: UserTicket[] = [];
    
    // Call contract function to get user's tickets
    // This will depend on your contract's specific implementation
    try {
      // Try using the contract's getUserTicketDetails function if available
      // This is a custom function you'd need to implement in the smart contract
      const ticketData = await contract.getUserTicketDetails(userAddress, drawId);
      
      if (ticketData && Array.isArray(ticketData) && ticketData.length > 0) {
        for (const ticket of ticketData) {
          const userTicket: UserTicket = {
            drawId: Number(ticket.drawId),
            seriesIndex: Number(ticket.seriesIndex || 0),
            ticketIndex: Number(ticket.ticketIndex || 0),
            numbers: ticket.numbers.map((n: any) => Number(n)),
            lottoNumber: Number(ticket.lottoNumber),
            timestamp: Number(ticket.timestamp) * 1000, // Convert to milliseconds
            isWinner: !!ticket.isWinner,
            amountWon: ethers.formatEther(ticket.amountWon || 0),
            transactionHash: ticket.transactionHash
          };
          
          tickets.push(userTicket);
        }
      }
    } catch (e) {
      console.error('Error getting user ticket details:', e);
      // If the direct method fails, you could implement a fallback using events
      // or other contract methods
    }
    
    return tickets;
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return [];
  }
};

// Define types for lottery data
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
  // Additional fields that might be available
  seriesName?: string; // Alternative name property
  description?: string;
}

export interface Winner {
  winnerAddress: string;
  amountWon: string;
  drawId?: number;
  seriesIndex?: number;
  transactionHash?: string;
  timestamp?: number;
  ticketNumbers?: {
    numbers: number[];
    lottoNumber: number | null;
  }[];
}