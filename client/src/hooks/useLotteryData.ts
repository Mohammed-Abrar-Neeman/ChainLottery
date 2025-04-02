import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getLotteryData, 
  LotteryData, 
  formatTimeRemaining, 
  generateQuickPick,
  buyLotteryTicket,
  getSeriesList,
  getSeriesDraws,
  getTotalDrawsInSeries,
  LotterySeries,
  LotteryDraw
} from '@/lib/lotteryContract';
import { apiRequest } from '@/lib/queryClient';
import { useWallet } from '@/hooks/useWallet';
import { toast } from '@/hooks/use-toast';

export function useLotteryData() {
  const { provider, chainId, account, isConnected } = useWallet();
  const queryClient = useQueryClient();
  const [selectedSeriesIndex, setSelectedSeriesIndex] = useState<number | undefined>(undefined);
  const [selectedDrawId, setSelectedDrawId] = useState<number | undefined>(undefined);
  
  // Query for fetching series list
  const {
    data: seriesList,
    isLoading: isLoadingSeriesList,
    error: seriesListError
  } = useQuery({
    queryKey: ['seriesList', chainId],
    queryFn: async () => {
      if (!provider || !chainId) return [];
      return await getSeriesList(provider, chainId);
    },
    enabled: !!provider && !!chainId,
  });
  
  // Query to check if a series has any draws
  const {
    data: totalDrawsCount,
    isLoading: isLoadingTotalDrawsCount
  } = useQuery({
    queryKey: ['totalDrawsCount', chainId, selectedSeriesIndex],
    queryFn: async () => {
      if (!provider || !chainId || selectedSeriesIndex === undefined) return 0;
      return await getTotalDrawsInSeries(provider, chainId, selectedSeriesIndex);
    },
    enabled: !!provider && !!chainId && selectedSeriesIndex !== undefined,
  });
  
  // Query for fetching draws in the selected series
  const {
    data: seriesDraws,
    isLoading: isLoadingSeriesDraws,
    error: seriesDrawsError
  } = useQuery({
    queryKey: ['seriesDraws', chainId, selectedSeriesIndex],
    queryFn: async () => {
      if (!provider || !chainId || selectedSeriesIndex === undefined) return [];
      return await getSeriesDraws(provider, chainId, selectedSeriesIndex);
    },
    enabled: !!provider && !!chainId && selectedSeriesIndex !== undefined,
  });
  
  // Query for fetching lottery data from smart contract
  const { 
    data: lotteryData,
    isLoading: isLoadingLotteryData,
    error: lotteryError,
    refetch: refetchLotteryData
  } = useQuery({
    queryKey: ['lotteryData', chainId, selectedSeriesIndex, selectedDrawId],
    queryFn: async () => {
      if (!provider || !chainId) return null;
      return await getLotteryData(provider, chainId, selectedSeriesIndex, selectedDrawId);
    },
    enabled: !!provider && !!chainId,
    refetchInterval: 30000 // Refetch every 30 seconds
  });
  
  // Real-time time remaining calculation based on endTimestamp from contract
  const [calculatedTimeRemaining, setCalculatedTimeRemaining] = useState(
    lotteryData?.timeRemaining 
      ? formatTimeRemaining(lotteryData.timeRemaining)
      : { days: 0, hours: 11, minutes: 46, seconds: 29 } // Default fallback
  );
  
  // Update time remaining every second based on endTimestamp
  useEffect(() => {
    // Initialize time remaining when lottery data is fetched
    if (lotteryData?.endTimestamp) {
      const updateTimeRemaining = () => {
        const now = Math.floor(Date.now() / 1000);
        const secondsRemaining = Math.max(0, lotteryData.endTimestamp! - now);
        setCalculatedTimeRemaining(formatTimeRemaining(secondsRemaining));
      };
      
      // Update immediately
      updateTimeRemaining();
      
      // Then update every second
      const interval = setInterval(updateTimeRemaining, 1000);
      
      return () => clearInterval(interval);
    } else if (lotteryData?.timeRemaining) {
      // If we don't have endTimestamp but we have timeRemaining, use that
      setCalculatedTimeRemaining(formatTimeRemaining(lotteryData.timeRemaining));
    }
  }, [lotteryData?.endTimestamp, lotteryData?.timeRemaining]);
  
  // Use the calculated time remaining
  const timeRemaining = calculatedTimeRemaining;
  
  // Query for fetching current lottery info
  const {
    data: currentLottery,
    isLoading: isLoadingCurrentLottery,
    error: currentLotteryError
  } = useQuery({
    queryKey: ['/api/lottery/current'],
    enabled: true,
  });
  
  // Query for fetching participant list from API for the current round
  const {
    data: participants,
    isLoading: isLoadingParticipants,
    error: participantsError
  } = useQuery({
    queryKey: ['/api/lottery/1/participants'], // Use 1 as a temporary ID (first round)
    enabled: true, // Always enable this for now since the round ID is hardcoded
  });
  
  // Query for fetching past winners from API
  const {
    data: pastWinners,
    isLoading: isLoadingPastWinners,
    error: pastWinnersError
  } = useQuery({
    queryKey: ['/api/lottery/history'],
    enabled: true,
  });
  
  // Mutation for buying lottery ticket
  const buyTicketMutation = useMutation({
    mutationFn: async ({ 
      numbers, 
      lottoNumber, 
      seriesIndex, 
      drawId 
    }: { 
      numbers: number[], 
      lottoNumber: number, 
      seriesIndex?: number, 
      drawId?: number 
    }) => {
      if (!provider || !chainId) {
        throw new Error('Wallet not connected');
      }
      
      // Execute the blockchain transaction
      const result = await buyLotteryTicket(
        provider, 
        chainId, 
        numbers, 
        lottoNumber, 
        seriesIndex, 
        drawId
      );
      
      if (!result.success || !result.txHash || !account) {
        throw new Error('Transaction failed');
      }
      
      // Record the purchase in the backend
      // Note: in a production app, we'd want to listen for events from the smart contract
      // rather than recording purchases manually
      if (lotteryData?.currentDraw) {
        await apiRequest('POST', '/api/lottery/record-purchase', {
          roundId: lotteryData.currentDraw,
          walletAddress: account,
          ticketCount: 1, // Each transaction is 1 ticket in the new contract
          transactionHash: result.txHash
        });
      }
      
      return { success: true, txHash: result.txHash, numbers, lottoNumber };
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['lotteryData'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lottery/current'] });
      
      if (account) {
        queryClient.invalidateQueries({ queryKey: [`/api/lottery/my-tickets/${account}`] });
      }
    }
  });
  
  // Function to generate a quick pick and buy a ticket
  const buyQuickPickTicket = useCallback(async (seriesIdx?: number, drawId?: number) => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to buy tickets.",
        variant: "destructive"
      });
      return { success: false, txHash: null };
    }
    
    try {
      // Generate random numbers
      const quickPick = generateQuickPick();
      
      // Buy ticket with those numbers
      return await buyTicketMutation.mutateAsync({
        ...quickPick,
        seriesIndex: seriesIdx,
        drawId: drawId
      });
    } catch (error) {
      console.error('Error buying quick pick ticket:', error);
      return { success: false, txHash: null };
    }
  }, [buyTicketMutation, isConnected]);
  
  // Function to buy a custom number ticket
  const buyCustomTicket = useCallback(async (
    numbers: number[], 
    lottoNumber: number,
    seriesIdx?: number,
    drawId?: number
  ) => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to buy tickets.",
        variant: "destructive"
      });
      return { success: false, txHash: null };
    }
    
    try {
      return await buyTicketMutation.mutateAsync({ 
        numbers, 
        lottoNumber,
        seriesIndex: seriesIdx,
        drawId: drawId
      });
    } catch (error) {
      console.error('Error buying custom ticket:', error);
      return { success: false, txHash: null };
    }
  }, [buyTicketMutation, isConnected]);
  
  // Format USD values
  const formatUSD = useCallback((ethValue: string) => {
    // Using a fixed ETH price for simplicity
    // In a real app, you would fetch the current ETH price from an API
    const ethPrice = 2388.67;
    const usdValue = parseFloat(ethValue) * ethPrice;
    return `$${usdValue.toFixed(2)}`;
  }, []);
  
  // For backward compatibility with existing UI components
  const buyTickets = useCallback(async (ticketCount: number) => {
    if (ticketCount !== 1) {
      toast({
        title: "Multiple Tickets Not Supported",
        description: "In the new contract, tickets must be purchased one at a time with specific numbers.",
        variant: "destructive"
      });
      return { success: false, txHash: null };
    }
    
    // Buy a single quick pick ticket with the selected series and draw
    return await buyQuickPickTicket(selectedSeriesIndex, selectedDrawId);
  }, [buyQuickPickTicket, selectedSeriesIndex, selectedDrawId]);
  
  // Initialize series selection when seriesList loads and none is selected
  useEffect(() => {
    if (seriesList && seriesList.length > 0 && selectedSeriesIndex === undefined) {
      // Select the first active series, or the last series if no active ones
      const activeSeries = seriesList.find(series => series.active);
      if (activeSeries) {
        setSelectedSeriesIndex(activeSeries.index);
      } else if (seriesList.length > 0) {
        setSelectedSeriesIndex(seriesList[seriesList.length - 1].index);
      }
    }
  }, [seriesList, selectedSeriesIndex]);
  
  // Initialize or reset draw selection when seriesDraws or totalDrawsCount changes
  useEffect(() => {
    // If there are no draws in this series, reset the selectedDrawId
    if ((totalDrawsCount !== undefined && totalDrawsCount <= 0) || 
        !seriesDraws || seriesDraws.length === 0) {
      setSelectedDrawId(undefined);
      return;
    }
    
    // Only initialize if we have draws and no selection yet
    if (seriesDraws && seriesDraws.length > 0 && selectedDrawId === undefined) {
      // Find the active/ongoing draw or select the newest one
      const activeDraws = seriesDraws.filter(draw => !draw.completed);
      if (activeDraws.length > 0) {
        // Sort by drawId to get the latest active draw
        const latestActiveDraw = activeDraws.sort((a, b) => b.drawId - a.drawId)[0];
        setSelectedDrawId(latestActiveDraw.drawId);
      } else {
        // If no active draws, get the most recent completed one
        const latestDraw = seriesDraws.sort((a, b) => b.drawId - a.drawId)[0];
        setSelectedDrawId(latestDraw.drawId);
      }
    }
  }, [seriesDraws, selectedDrawId, totalDrawsCount]);
  
  // Utility function to check if draws are available
  const areDrawsAvailable = useCallback(() => {
    try {
      // Check both data and errors to determine if draws are available
      if (lotteryError || seriesDrawsError || !lotteryData || !provider) {
        return false;
      }
      return totalDrawsCount !== undefined && totalDrawsCount > 0 && seriesDraws && seriesDraws.length > 0;
    } catch (error) {
      console.log("Error in areDrawsAvailable check:", error);
      // Return false to safely disable UI elements on error
      return false;
    }
  }, [totalDrawsCount, seriesDraws, lotteryError, seriesDrawsError, lotteryData, provider]);
  
  // Enhanced function that specifically checks for the availability of draws in a selected series
  const hasAvailableDraws = useCallback(() => {
    try {
      // First perform general checks for draw availability
      if (!areDrawsAvailable()) {
        return false;
      }
      
      // Then perform more specific checks for the selected series
      if (selectedSeriesIndex === undefined) {
        return false;
      }
      
      // Check if we have draws for the selected series
      const hasDrawsForSeries = seriesDraws && 
                               seriesDraws.length > 0 && 
                               seriesDraws.some(draw => draw.drawId > 0 && !draw.completed);
      
      return hasDrawsForSeries;
    } catch (error) {
      console.log("Error checking draw availability:", error);
      // In case of errors, return false to safely disable UI elements
      return false;
    }
  }, [areDrawsAvailable, selectedSeriesIndex, seriesDraws]);
  
  // Get empty lottery data for when no draws are available
  const emptyLotteryData: LotteryData = {
    jackpotAmount: "0",
    ticketPrice: "0",
    currentDraw: 0,
    timeRemaining: 0,
    participants: [],
    participantCount: 0,
    seriesIndex: selectedSeriesIndex || 0
  };
  
  // Reset time remaining when no draws are available
  const emptyTimeRemaining = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  
  return {
    // Lottery data - reset to empty values when no draws are available
    lotteryData: areDrawsAvailable() ? lotteryData : emptyLotteryData,
    isLoadingLotteryData,
    lotteryError,
    timeRemaining: areDrawsAvailable() ? timeRemaining : emptyTimeRemaining,
    
    // Series and draws data
    seriesList,
    isLoadingSeriesList,
    seriesDraws,
    isLoadingSeriesDraws,
    totalDrawsCount,
    isLoadingTotalDrawsCount,
    selectedSeriesIndex,
    selectedDrawId,
    
    // Selection functions
    setSelectedSeriesIndex,
    setSelectedDrawId,
    
    // Legacy data - reset to empty values when no draws are available
    currentLottery: areDrawsAvailable() ? currentLottery : null,
    isLoadingCurrentLottery,
    currentLotteryError,
    participants: areDrawsAvailable() ? participants : [],
    isLoadingParticipants,
    participantsError,
    pastWinners,
    isLoadingPastWinners,
    pastWinnersError,
    
    // Actions
    buyTickets, // For backward compatibility
    buyQuickPickTicket,
    buyCustomTicket,
    generateQuickPick,
    isBuyingTickets: buyTicketMutation.isPending,
    
    // Utilities
    formatUSD,
    refetchLotteryData,
    areDrawsAvailable, // Export the utility function
    hasAvailableDraws  // Export the enhanced utility function
  };
}
