import { useCallback, useMemo } from 'react';
import { useAppKitProvider, useAppKitAccount } from '@reown/appkit/react';
import { ethers } from 'ethers';
import { CONTRACTS, LOTTERY_ABI, LotteryData, LotteryDraw, LotterySeries, Participant, Winner } from '@/config/contracts';
import { DEFAULT_NETWORK } from '@/config/networks';
import { toast } from '@/hooks/use-toast';

// Validate environment variables
if (!process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS) {
  console.error('NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS is not defined in environment variables');
}

export const useLotteryContract = () => {
  const { walletProvider } = useAppKitProvider("eip155");
  const { address, isConnected } = useAppKitAccount();

  // Create a fallback provider for read-only operations
  const fallbackProvider = useMemo(() => {
    try {
      console.log('Creating fallback provider for network:', DEFAULT_NETWORK.name);
      return new ethers.JsonRpcProvider(DEFAULT_NETWORK.rpc);
    } catch (error) {
      console.error('Error creating fallback provider:', error);
      return null;
    }
  }, []);

  const getContract = useCallback(async () => {
    try {
      if (!CONTRACTS.LOTTERY) {
        console.error('Contract address not defined in environment variables');
        console.error('Please check your .env.local file and ensure NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS is set');
        return null;
      }

      // If wallet is connected, use wallet provider
      if (isConnected && address && walletProvider) {
        console.log('Using wallet provider for contract');
        try {
          // Create provider and get signer
          const ethersProvider = new ethers.BrowserProvider(walletProvider as any);
          const signer = await ethersProvider.getSigner();
          
          // Verify signer
          const signerAddress = await signer.getAddress();
          console.log('Got signer address:', signerAddress);
          
          if (!signerAddress) {
            throw new Error('Failed to get signer address');
          }

          // Create contract with signer
          const contract = new ethers.Contract(CONTRACTS.LOTTERY, LOTTERY_ABI, signer);
          
          // Verify contract
          const contractAddress = await contract.getAddress();
          console.log('Contract initialized with address:', contractAddress);
          
          return contract;
        } catch (error) {
          console.error('Error setting up contract with signer:', error);
          return null;
        }
      }
      
      // Otherwise use fallback provider for read-only operations
      if (!fallbackProvider) {
        console.error('Fallback provider not available');
        return null;
      }
      console.log('Using fallback provider for contract');
      return new ethers.Contract(CONTRACTS.LOTTERY, LOTTERY_ABI, fallbackProvider);
    } catch (error) {
      console.error('Error creating contract instance:', error);
      return null;
    }
  }, [isConnected, address, walletProvider, fallbackProvider]);

  // Check if current user is admin
  const checkIsAdmin = useCallback(async (): Promise<boolean> => {
    try {
      console.log('=== Admin Check Start ===');
      console.log('Connection status:', { isConnected, address });
      console.log('Contract address:', CONTRACTS.LOTTERY);
      
      if (!isConnected || !address) {
        console.log('Wallet not connected, admin check skipped');
        return false;
      }

      if (!CONTRACTS.LOTTERY) {
        console.error('Contract address not defined in environment variables');
        console.error('Please check your .env.local file and ensure NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS is set');
        return false;
      }

      console.log('Getting contract instance...');
      const contract = await getContract();
      if (!contract) {
        console.error('Contract not initialized');
        return false;
      }
      console.log('Contract instance created successfully');

      console.log('Fetching admin address...');
      const adminAddress = await contract.admin();
      console.log('Admin check results:', {
        adminAddress,
        userAddress: address,
        adminAddressLower: adminAddress.toLowerCase(),
        userAddressLower: address.toLowerCase(),
        isMatch: adminAddress.toLowerCase() === address.toLowerCase()
      });

      const isUserAdmin = adminAddress.toLowerCase() === address.toLowerCase();
      console.log('Is user admin:', isUserAdmin);
      
      return isUserAdmin;
    } catch (error: any) {
      console.error('Error checking admin status:', {
        message: error?.message,
        code: error?.code,
        data: error?.data,
        stack: error?.stack
      });
      return false;
    }
  }, [isConnected, address, getContract]);

  // Get lottery data for a specific series and draw
  const getLotteryData = useCallback(async (seriesIndex?: number, drawId?: number): Promise<LotteryData | null> => {
    try {
      console.log('=== Getting Lottery Data ===');
      console.log('Series Index:', seriesIndex);
      console.log('Draw ID:', drawId);

      const contract = await getContract();
      if (!contract) return null;

      if (!drawId) return null;

      // Get draw details in a single call
      console.log('Fetching draw details...');
      const drawDetails = await contract.getDrawDetails(drawId);
      console.log('Raw draw details:', drawDetails);

      // Get total tickets sold
      const totalTicketsSold = await contract.getTotalTicketsSold(drawId);
      console.log('Total tickets sold:', totalTicketsSold);

      // Parse winning ticket numbers from the tuple structure
      let winningTicketNumbers: number[] = [];
      try {
        // The winning ticket numbers are in index 8 of the tuple
        const winningNumbersProxy = drawDetails[8];
        if (winningNumbersProxy) {
          // Convert BigInt values to numbers
          winningTicketNumbers = Array.from({ length: 6 }, (_, i) => {
            const num = winningNumbersProxy[i];
            return num ? Number(num) : 0;
          }).filter(num => num !== 0);
        }
      } catch (error) {
        console.error('Error parsing winning ticket numbers:', error);
        winningTicketNumbers = [];
      }

      console.log('Parsed winning ticket numbers:', winningTicketNumbers);

      return {
        jackpotAmount: ethers.formatEther(drawDetails[3]), // index 3 is jackpot
        ticketPrice: ethers.formatEther(drawDetails[2]), // index 2 is ticket price
        currentDraw: Number(drawId),
        timeRemaining: Number(drawDetails[1]) - Math.floor(Date.now() / 1000), // index 1 is end time
        endTimestamp: Number(drawDetails[1]), // index 1 is end time
        winningTicketNumbers,
        participantCount: Number(totalTicketsSold),
        seriesIndex: seriesIndex,
        completed: drawDetails[7] // index 7 is completed status
      };
    } catch (error) {
      console.error('Error fetching lottery data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch lottery data",
        variant: "destructive"
      });
      return null;
    }
  }, [getContract]);

  // Get list of all series
  const getSeriesList = useCallback(async (): Promise<LotterySeries[]> => {
    try {
      const contract = await getContract();
      if (!contract) return [];

      const totalSeries = await contract.getTotalSeries();
      const series: LotterySeries[] = [];

      for (let i = 0; i < totalSeries; i++) {
        const [name, drawCount] = await Promise.all([
          contract.getSeriesNameByIndex(i),
          contract.getTotalDrawsInSeries(i)
        ]);
        
        series.push({
          index: i,
          active: true, // Contract doesn't have active status, assuming all are active
          drawCount: Number(drawCount),
          name: name,
          description: '' // Contract doesn't have description
        });
      }

      return series;
    } catch (error) {
      console.error('Error fetching series list:', error);
      toast({
        title: "Error",
        description: "Failed to fetch series list",
        variant: "destructive"
      });
      return [];
    }
  }, [getContract]);

  // Get draws for a specific series
  const getSeriesDraws = useCallback(async (seriesIndex: number): Promise<LotteryDraw[]> => {
    try {
      const contract = await getContract();
      if (!contract) return [];

      // Get all draw IDs for this series
      const drawIds = await contract.getSeriesDrawIdsByIndex(seriesIndex);
      const draws: LotteryDraw[] = [];

      // Get details for each draw
      for (const drawId of drawIds) {
        const drawData = await contract.getDrawDetails(drawId);
        draws.push({
          drawId: Number(drawId),
          seriesIndex,
          ticketPrice: ethers.formatEther(drawData.ticketPrice),
          jackpot: ethers.formatEther(drawData.jackpot),
          drawBlock: Number(drawData.drawBlock),
          isFutureBlockDraw: drawData.isFutureBlockDraw,
          completed: drawData.completed,
          winningNumbers: drawData.winningNumbers?.map((n: any) => Number(n)),
          endTimestamp: Number(drawData.estimatedEndTime)
        });
      }

      return draws;
    } catch (error) {
      console.error('Error fetching series draws:', error);
      toast({
        title: "Error",
        description: "Failed to fetch series draws",
        variant: "destructive"
      });
      return [];
    }
  }, [getContract]);

  // Buy a lottery ticket
  const buyTicket = useCallback(async (
    numbers: number[],
    lottoNumber: number,
    drawId: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    try {
      console.log('=== buyTicket Function Start ===');
      console.log('Parameters:', { numbers, lottoNumber, drawId });

      const contract = await getContract();
      if (!contract) {
        console.error('Contract not initialized');
        throw new Error('Contract not initialized');
      }

      if (!drawId) {
        console.error('Draw ID is required');
        throw new Error('Draw ID is required');
      }

      // Get ticket price for the draw
      console.log('Fetching ticket price for draw:', drawId);
      const ticketPrice = await contract.getTicketPrice(drawId);
      console.log('Ticket price:', ethers.formatEther(ticketPrice));

      // Convert numbers to uint8 array
      const uint8Numbers = numbers.map(n => Number(n)) as [number, number, number, number, number];
      
      console.log('Sending transaction with params:', {
        numbers: uint8Numbers,
        lottoNumber,
        drawId,
        value: ethers.formatEther(ticketPrice)
      });

      const tx = await contract.buyTicket(
        drawId,
        uint8Numbers,
        lottoNumber,
        { value: ticketPrice }
      );

      console.log('Transaction sent:', tx.hash);
      console.log('Waiting for confirmation...');

      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);

      return { success: true, txHash: receipt.hash };
    } catch (error: any) {
      console.error('=== buyTicket Error ===');
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        data: error?.data,
        transaction: error?.transaction
      });

      // Handle specific contract errors
      if (error?.data?.message) {
        return { 
          success: false, 
          error: error.data.message 
        };
      }

      // Handle MetaMask errors
      if (error?.code === 4001) {
        return { 
          success: false, 
          error: 'Transaction rejected by user' 
        };
      }

      // Handle insufficient funds
      if (error?.code === -32603 && error?.message?.includes('insufficient funds')) {
        return { 
          success: false, 
          error: 'Insufficient funds for transaction' 
        };
      }

      // Handle gas errors
      if (error?.code === -32603 && error?.message?.includes('gas required exceeds allowance')) {
        return { 
          success: false, 
          error: 'Gas limit too low' 
        };
      }

      // Return generic error
      return { 
        success: false, 
        error: error?.message || 'Failed to buy ticket' 
      };
    }
  }, [getContract]);

  // Generate quick pick numbers
  const generateQuickPick = useCallback((): { numbers: number[], lottoNumber: number } => {
    const numbers: number[] = [];
    while (numbers.length < 5) {
      const num = Math.floor(Math.random() * 70) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    const lottoNumber = Math.floor(Math.random() * 30) + 1;
    return { numbers, lottoNumber };
  }, []);

  // Check if user has won any prizes
  const checkUserPrizes = useCallback(async (drawId: number, ticketIndex: number): Promise<string> => {
    try {
      const contract = await getContract();
      if (!contract) return '0';

      const prize = await contract.checkPrize(drawId, ticketIndex);
      return ethers.formatEther(prize);
    } catch (error) {
      console.error('Error checking prize:', error);
      return '0';
    }
  }, [getContract]);

  // Get user's tickets for a specific draw
  const getUserTickets = useCallback(async (drawId: number): Promise<number[]> => {
    try {
      const contract = await getContract();
      if (!contract || !address) return [];

      return await contract.getUserTickets(address, drawId);//check
    } catch (error) {
      console.error('Error getting user tickets:', error);
      return [];
    }
  }, [getContract, address]);

  // Get ticket price for a specific draw
  const getTicketPrice = useCallback(async (drawId?: number): Promise<number> => {
    try {
      const contract = await getContract();
      if (!contract) return 0;

      const price = await contract.getTicketPrice(drawId ?? 0);
      return Number(ethers.formatEther(price));
    } catch (error) {
      console.error('Error getting ticket price:', error);
      return 0;
    }
  }, [getContract]);

  // Buy multiple lottery tickets
  const buyMultipleTickets = useCallback(async (
    numbersList: number[][],
    lottoNumbers: number[],
    drawId: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    try {
      console.log('=== buyMultipleTickets Function Start ===');
      console.log('Parameters:', { numbersList, lottoNumbers, drawId });

      const contract = await getContract();
      if (!contract) {
        console.error('Contract not initialized');
        throw new Error('Contract not initialized');
      }

      if (!drawId) {
        console.error('Draw ID is required');
        throw new Error('Draw ID is required');
      }

      // Get ticket price for the draw
      console.log('Fetching ticket price for draw:', drawId);
      const ticketPrice = await contract.getTicketPrice(drawId);
      console.log('Ticket price:', ethers.formatEther(ticketPrice));

      // Convert numbers to uint8 arrays
      const uint8NumbersList = numbersList.map(numbers => 
        numbers.map(n => Number(n)) as [number, number, number, number, number]
      );
      
      // Calculate total value
      const totalValue = ticketPrice * BigInt(numbersList.length);
      console.log('Total value:', ethers.formatEther(totalValue));
      
      console.log('Sending transaction with params:', {
        numbersList: uint8NumbersList,
        lottoNumbers,
        drawId,
        value: ethers.formatEther(totalValue)
      });

      const tx = await contract.buyMultipleTickets(
        drawId,
        uint8NumbersList,
        lottoNumbers,
        { value: totalValue }
      );

      console.log('Transaction sent:', tx.hash);
      console.log('Waiting for confirmation...');

      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);

      return { success: true, txHash: receipt.hash };
    } catch (error: any) {
      console.error('=== buyMultipleTickets Error ===');
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        data: error?.data,
        transaction: error?.transaction
      });

      // Handle specific contract errors
      if (error?.data?.message) {
        return { 
          success: false, 
          error: error.data.message 
        };
      }

      // Handle MetaMask errors
      if (error?.code === 4001) {
        return { 
          success: false, 
          error: 'Transaction rejected by user' 
        };
      }

      // Handle insufficient funds
      if (error?.code === -32603 && error?.message?.includes('insufficient funds')) {
        return { 
          success: false, 
          error: 'Insufficient funds for transaction' 
        };
      }

      // Handle gas errors
      if (error?.code === -32603 && error?.message?.includes('gas required exceeds allowance')) {
        return { 
          success: false, 
          error: 'Gas limit too low' 
        };
      }

      // Return generic error
      return { 
        success: false, 
        error: error?.message || 'Failed to buy tickets' 
      };
    }
  }, [getContract]);

  return {
    getContract,
    getLotteryData,
    getSeriesList,
    getSeriesDraws,
    buyTicket,
    generateQuickPick,
    checkUserPrizes,
    getUserTickets,
    isConnected,
    address,
    getTicketPrice,
    buyMultipleTickets,
    checkIsAdmin
  };
}; 