import { useCallback, useMemo } from 'react';
import { useAppKitProvider, useAppKitAccount } from '@reown/appkit/react';
import { ethers } from 'ethers';
import { CONTRACTS, LOTTERY_ABI, LotteryData, LotteryDraw, LotterySeries, Participant, Winner } from '@/config/contracts';
import { toast } from '@/hooks/use-toast';

export const useLotteryContract = () => {
  const { walletProvider } = useAppKitProvider("eip155");
  const { address, isConnected } = useAppKitAccount();

  const getContract = useCallback(async () => {
    if (!isConnected || !address || !walletProvider) return null;
    const ethersProvider = new ethers.BrowserProvider(walletProvider as any);
    const signer = await ethersProvider.getSigner();
    return new ethers.Contract(CONTRACTS.LOTTERY, LOTTERY_ABI, signer);
  }, [isConnected, address, walletProvider]);

  // Get lottery data for a specific series and draw
  const getLotteryData = useCallback(async (seriesIndex?: number, drawId?: number): Promise<LotteryData | null> => {
    try {
      const contract = await getContract();
      if (!contract) return null;

      if (!drawId) return null;

      // Get individual pieces of data
      const [
        ticketPrice,
        jackpot,
        startTime,
        endTime,
        isFutureBlockDraw,
        completed,
        winningNumbers,
        totalTickets,
        totalWinners
      ] = await Promise.all([
        contract.getTicketPrice(drawId),
        contract.getJackpot(drawId),
        contract.getDrawStartTime(drawId),
        contract.getEstimatedEndTime(drawId),
        contract.getIsFutureBlockDraw(drawId),
        contract.getCompleted(drawId),
        contract.getTotalTicketsSold(drawId),
        contract.getTotalWinners(drawId)
      ]);

      // Get participants (winners)
      const winners = await contract.getWinners(drawId);

      return {
        jackpotAmount: ethers.formatEther(jackpot),
        ticketPrice: ethers.formatEther(ticketPrice),
        currentDraw: Number(drawId),
        timeRemaining: Number(endTime) - Math.floor(Date.now() / 1000),
        endTimestamp: Number(endTime),
        participants: winners.map((w: any) => ({
          walletAddress: w.winnerAddress,
          ticketCount: 1, // Each winner has one winning ticket
          timestamp: 0, // Not available in contract
          transactionHash: '', // Not available in contract
          drawId: Number(drawId),
          seriesIndex: seriesIndex
        })),
        participantCount: Number(totalTickets),
        seriesIndex: seriesIndex
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

      return await contract.getUserTickets(address, drawId);
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
    buyMultipleTickets
  };
}; 