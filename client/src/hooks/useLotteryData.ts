import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getLotteryData, 
  LotteryData, 
  formatTimeRemaining, 
  generateQuickPick,
  buyLotteryTicket,
  buyMultipleTickets,
  getSeriesList,
  getSeriesDraws,
  getTotalDrawsInSeries,
  getDrawParticipants,
  LotterySeries,
  LotteryDraw,
  Participant
} from '@/lib/lotteryContract';
import { apiRequest } from '@/lib/queryClient';
import { useWallet } from '@/hooks/useWallet';
import { toast } from '@/hooks/use-toast';
import { ethers } from 'ethers';

export function useLotteryData() {
  const { provider: walletProvider, chainId: walletChainId, account, isConnected } = useWallet();
  // Fallback to public provider if wallet is not connected
  const fallbackProvider = useMemo(() => new ethers.JsonRpcProvider("https://ethereum-sepolia.publicnode.com"), []);
  const provider = walletProvider || fallbackProvider;
  const chainId = walletChainId || '11155111'; // Default to Sepolia chainId
  const queryClient = useQueryClient();
  const [selectedSeriesIndex, setSelectedSeriesIndexInternal] = useState<number | undefined>(undefined);
  
  // Custom setter for selectedSeriesIndex with validation and persistence
  const setSelectedSeriesIndex = useCallback((seriesIdx: number | undefined) => {
    console.log("Setting selected series index to:", seriesIdx);
    if (seriesIdx !== selectedSeriesIndex) {
      if (seriesIdx !== undefined && Number.isInteger(seriesIdx) && seriesIdx >= 0) {
        setSelectedSeriesIndexInternal(seriesIdx);
        // Reset draw ID when changing series
        setSelectedDrawIdInternal(undefined);
        // Store in localStorage
        try {
          const selection = { seriesIndex: seriesIdx, drawId: undefined };
          localStorage.setItem('lottery_selection', JSON.stringify(selection));

          // Need to wait for state update to complete before refetching
          setTimeout(() => {
            // Refresh series draws data
            queryClient.invalidateQueries({ queryKey: ['seriesDraws', chainId, seriesIdx] });
            console.log(`Invalidated query cache for series ${seriesIdx} draws`);
          }, 0);
        } catch (e) {
          console.error("Failed to save selection to localStorage:", e);
        }
      } else {
        console.warn("Invalid series index provided:", seriesIdx);
      }
    }
  }, [selectedSeriesIndex, chainId, queryClient]);
  const [selectedDrawId, setSelectedDrawIdInternal] = useState<number | undefined>(undefined);
  
  // Custom setter for selectedDrawId that also triggers a refetch of participants
  const setSelectedDrawId = useCallback((drawId: number | undefined) => {
    if (drawId !== selectedDrawId) {
      console.log("useLotteryData - Setting new draw ID and triggering refetch:", drawId);
      if (drawId !== undefined && Number.isInteger(drawId)) {
        setSelectedDrawIdInternal(drawId);
        // Update the stored selection in localStorage to persist across page refreshes
        try {
          const selection = { seriesIndex: selectedSeriesIndex, drawId };
          localStorage.setItem('lottery_selection', JSON.stringify(selection));
        } catch (e) {
          console.error("Failed to save selection to localStorage:", e);
        }
      } else {
        console.warn("Invalid draw ID provided:", drawId);
      }
      // We'll refetch participants when this change is detected in our queries
    }
  }, [selectedDrawId, selectedSeriesIndex]);
  
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
    staleTime: 60000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
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
    staleTime: 60000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
  
  // Query for fetching draws in the selected series
  const {
    data: seriesDraws,
    isLoading: isLoadingSeriesDraws,
    error: seriesDrawsError,
    refetch: refetchSeriesDraws
  } = useQuery({
    queryKey: ['seriesDraws', chainId, selectedSeriesIndex],
    queryFn: async () => {
      if (!provider || !chainId || selectedSeriesIndex === undefined) return [];
      const draws = await getSeriesDraws(provider, chainId, selectedSeriesIndex);
      return draws;
    },
    enabled: !!provider && !!chainId && selectedSeriesIndex !== undefined,
    staleTime: 60000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
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
    staleTime: 60000, // Increase stale time to 1 minute
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: 60000 // Reduce refetch interval to 1 minute
  });
  
  // Real-time time remaining calculation based on endTimestamp from contract
  const [calculatedTimeRemaining, setCalculatedTimeRemaining] = useState(
    lotteryData?.timeRemaining 
      ? formatTimeRemaining(lotteryData.timeRemaining)
      : { days: 0, hours: 0, minutes: 0, seconds: 0 } // Empty initial state
  );
  
  // Update time remaining every second based on endTimestamp
  useEffect(() => {
    // Initialize time remaining when lottery data is fetched
    if (lotteryData?.endTimestamp) {
      console.log(`Setting up timer with end timestamp: ${new Date(lotteryData.endTimestamp).toISOString()}`);
      
      const updateTimeRemaining = () => {
        const now = Date.now();
        const endTime = lotteryData.endTimestamp!;
        const secondsRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
        
        // Log current time values for debugging
        console.log(`Countdown debug:
          Now: ${new Date(now).toISOString()}
          End: ${new Date(endTime).toISOString()}
          Diff: ${((endTime - now) / 1000).toFixed(0)} seconds
          Draw ID: ${selectedDrawId}
          Series: ${selectedSeriesIndex}
        `);
        
        const formattedTime = formatTimeRemaining(secondsRemaining);
        setCalculatedTimeRemaining(formattedTime);
      };
      
      // Update immediately
      updateTimeRemaining();
      
      // Then update every second
      const interval = setInterval(updateTimeRemaining, 1000);
      console.log("Started countdown timer interval");
      
      return () => {
        console.log("Clearing countdown timer interval");
        clearInterval(interval);
      };
    } else if (lotteryData?.timeRemaining) {
      // If we don't have endTimestamp but we have timeRemaining, use that
      // But set up the timer to count down from this value
      console.log(`Using static timeRemaining value: ${lotteryData.timeRemaining} seconds`);
      
      // Calculate an end timestamp based on the current time + timeRemaining
      const calculatedEndTimestamp = Date.now() + (lotteryData.timeRemaining * 1000);
      
      const updateTimeRemaining = () => {
        const now = Date.now();
        const secondsRemaining = Math.max(0, Math.floor((calculatedEndTimestamp - now) / 1000));
        const formattedTime = formatTimeRemaining(secondsRemaining);
        setCalculatedTimeRemaining(formattedTime);
      };
      
      // Update immediately
      updateTimeRemaining();
      
      // Then update every second
      const interval = setInterval(updateTimeRemaining, 1000);
      console.log("Started countdown timer interval (from timeRemaining)");
      
      return () => {
        console.log("Clearing countdown timer interval");
        clearInterval(interval);
      };
    } else {
      console.log("No time data available, using empty time");
      setCalculatedTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    }
  }, [lotteryData?.endTimestamp, lotteryData?.timeRemaining, selectedDrawId, selectedSeriesIndex]);
  
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
    staleTime: 60000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
  
  // Query for fetching participant list from API for the current round
  const {
    data: participants,
    isLoading: isLoadingParticipants,
    error: participantsError
  } = useQuery({
    queryKey: ['/api/lottery/1/participants'], // Use 1 as a temporary ID (first round)
    enabled: true, // Always enable this for now since the round ID is hardcoded
    staleTime: 60000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
  
  // Query for fetching draw-specific participants directly from blockchain
  const {
    data: rawDrawParticipantsData,
    isLoading: isLoadingDrawParticipants,
    error: drawParticipantsError,
    refetch: refetchDrawParticipants
  } = useQuery({
    queryKey: ['drawParticipants', chainId, selectedSeriesIndex, selectedDrawId],
    queryFn: async () => {
      if (!provider || !chainId) return { participants: [], counts: {} };
      const drawIdToUse = selectedDrawId !== undefined ? selectedDrawId : 1;
      const result = await getDrawParticipants(provider, chainId, drawIdToUse, selectedSeriesIndex);
      return result;
    },
    enabled: !!provider && !!chainId,
    staleTime: 60000, // Increase stale time to 1 minute
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: 120000 // Reduce refetch interval to 2 minutes
  });
  
  // This is now handled in ParticipantsList.tsx
  const drawParticipants: any[] = [];
  
  // Function to refresh series data
  const refreshSeriesData = useCallback(async (seriesIdx?: number) => {
    console.log(`Explicitly refreshing data for series ${seriesIdx !== undefined ? seriesIdx : 'all'}`);
    
    // Invalidate series list cache
    queryClient.invalidateQueries({ queryKey: ['seriesList', chainId] });
    
    // If a specific series index is provided, also invalidate that series' draws
    if (seriesIdx !== undefined) {
      queryClient.invalidateQueries({ queryKey: ['seriesDraws', chainId, seriesIdx] });
      queryClient.invalidateQueries({ queryKey: ['totalDrawsCount', chainId, seriesIdx] });
    } else {
      // If no specific series index is provided, invalidate all series-related queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && 
                 (queryKey[0] === 'seriesDraws' || queryKey[0] === 'totalDrawsCount');
        }
      });
    }
    
    // Also refresh lottery data
    await refetchLotteryData();
    
    return true;
  }, [chainId, queryClient, refetchLotteryData]);
  
  // Enhanced refetch function that can accept an override draw ID
  const enhancedRefetchParticipants = useCallback(async (overrideDrawId?: number) => {
    console.log('useLotteryData - Enhanced refetch participants called', { 
      overrideDrawId, 
      currentDrawId: selectedDrawId 
    });
    
    // If an override draw ID is provided, we'll use that instead of the selectedDrawId
    if (overrideDrawId !== undefined && overrideDrawId !== selectedDrawId) {
      // Temporarily set the selectedDrawId to the override
      console.log(`Temporarily changing selectedDrawId from ${selectedDrawId} to ${overrideDrawId} for refetch`);
      setSelectedDrawId(overrideDrawId);
    }
    
    // Refetch the participants data
    return await refetchDrawParticipants();
  }, [selectedDrawId, refetchDrawParticipants, setSelectedDrawId]);
  
  // Force refetch series draws when selectedSeriesIndex changes
  useEffect(() => {
    if (selectedSeriesIndex !== undefined) {
      console.log('useLotteryData - Series index changed, triggering draws refetch:', selectedSeriesIndex);
      // Add a small delay to allow state updates to complete
      setTimeout(() => {
        refetchSeriesDraws();
      }, 100);
    }
  }, [selectedSeriesIndex, refetchSeriesDraws]);
  
  // Query for fetching past winners from API
  const {
    data: pastWinners,
    isLoading: isLoadingPastWinners,
    error: pastWinnersError
  } = useQuery({
    queryKey: ['/api/lottery/history'],
    enabled: true,
    staleTime: 60000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
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
      if (!walletProvider || !chainId) {
        throw new Error('Wallet not connected');
      }
      // Execute the blockchain transaction
      const result = await buyLotteryTicket(
        walletProvider, 
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
  
  // Mutation for buying multiple lottery tickets
  const buyMultipleTicketsMutation = useMutation({
    mutationFn: async ({ 
      tickets, 
      seriesIndex, 
      drawId 
    }: { 
      tickets: { numbers: number[], lottoNumber: number }[], 
      seriesIndex?: number, 
      drawId?: number 
    }) => {
      if (!walletProvider || !chainId) {
        throw new Error('Wallet not connected');
      }
      // Execute the blockchain transaction
      const result = await buyMultipleTickets(
        walletProvider, 
        chainId, 
        tickets, 
        seriesIndex, 
        drawId
      );
      if (!result.success || !result.txHash || !account) {
        throw new Error('Transaction failed');
      }
      // Record the purchase in the backend
      if (lotteryData?.currentDraw) {
        await apiRequest('POST', '/api/lottery/record-purchase', {
          roundId: lotteryData.currentDraw,
          walletAddress: account,
          ticketCount: tickets.length, // Each transaction contains multiple tickets
          transactionHash: result.txHash
        });
      }
      return { success: true, txHash: result.txHash, ticketCount: tickets.length };
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['lotteryData'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lottery/current'] });
      if (account) {
        queryClient.invalidateQueries({ queryKey: [`/api/lottery/my-tickets/${account}`] });
      }
      // Invalidate participants data
      if (selectedDrawId) {
        queryClient.invalidateQueries({ queryKey: ['drawParticipants', chainId, selectedSeriesIndex, selectedDrawId] });
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
  const formatUSD = useCallback((ethValue: string | number) => {
    // Using a fixed ETH price for simplicity
    // In a real app, you would fetch the current ETH price from an API
    const ethPrice = 2388.67;
    
    // Handle different input types or invalid inputs
    try {
      // Convert to string if it's a number
      const valueAsString = typeof ethValue === 'number' ? ethValue.toString() : ethValue;
      
      // If the value is empty, null, or undefined
      if (!valueAsString || valueAsString === '0' || valueAsString === 'undefined' || valueAsString === 'null') {
        return '$0.00';
      }
      
      // Parse to float and calculate USD value
      const ethAmount = parseFloat(valueAsString);
      
      // Check if parsing resulted in NaN
      if (isNaN(ethAmount)) {
        console.warn('formatUSD received invalid input:', ethValue);
        return '$0.00';
      }
      
      // Calculate USD value and format
      const usdValue = ethAmount * ethPrice;
      
      // Format with commas for thousands and fixed 2 decimal places
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(usdValue);
    } catch (error) {
      console.error('Error formatting USD value:', error);
      return '$0.00';
    }
  }, []);
  
  // Function to generate multiple quick picks and buy tickets in a single transaction
  const buyMultipleQuickPickTickets = useCallback(async (
    ticketCount: number,
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
    
    // Validate ticket count
    if (ticketCount <= 0 || ticketCount > 20) { // Limit to 20 tickets per transaction
      toast({
        title: "Invalid Ticket Count",
        description: "You can buy between 1 and 20 tickets in a single transaction.",
        variant: "destructive"
      });
      return { success: false, txHash: null };
    }
    
    try {
      // Generate multiple random tickets
      const tickets = Array.from({ length: ticketCount }, () => generateQuickPick());
      
      // Buy tickets with those numbers
      return await buyMultipleTicketsMutation.mutateAsync({
        tickets,
        seriesIndex: seriesIdx,
        drawId: drawId
      });
    } catch (error) {
      console.error('Error buying multiple quick pick tickets:', error);
      return { success: false, txHash: null };
    }
  }, [buyMultipleTicketsMutation, isConnected]);
  
  // For backward compatibility with existing UI components
  const buyTickets = useCallback(async (ticketCount: number) => {
    if (ticketCount === 1) {
      // Buy a single quick pick ticket with the selected series and draw
      return await buyQuickPickTicket(selectedSeriesIndex, selectedDrawId);
    } else if (ticketCount > 1) {
      // Buy multiple quick pick tickets with the selected series and draw
      return await buyMultipleQuickPickTickets(ticketCount, selectedSeriesIndex, selectedDrawId);
    } else {
      toast({
        title: "Invalid Ticket Count",
        description: "Please select at least one ticket to purchase.",
        variant: "destructive"
      });
      return { success: false, txHash: null };
    }
  }, [buyQuickPickTicket, buyMultipleQuickPickTickets, selectedSeriesIndex, selectedDrawId]);
  
  // Initialize series selection when seriesList loads
  useEffect(() => {
    if (!seriesList || seriesList.length === 0) {
      return;
    }
    // Only initialize if we don't have a selection yet
    if (selectedSeriesIndex === undefined) {
      // Try to get selection from localStorage first
      let savedSeriesIndex: number | undefined = undefined;
      try {
        const savedSelection = localStorage.getItem('lottery_selection');
        if (savedSelection) {
          const { seriesIndex } = JSON.parse(savedSelection);
          if (seriesIndex !== undefined && seriesList.some(s => s.index === seriesIndex)) {
            savedSeriesIndex = seriesIndex;
          }
        }
      } catch (e) {
        // ignore
      }
      if (savedSeriesIndex !== undefined && savedSeriesIndex !== selectedSeriesIndex) {
        setSelectedSeriesIndexInternal(savedSeriesIndex);
      } else {
        const activeSeries = seriesList.find(series => series.active);
        const defaultIndex = activeSeries ? activeSeries.index : seriesList[seriesList.length - 1].index;
        if (defaultIndex !== selectedSeriesIndex) {
          setSelectedSeriesIndexInternal(defaultIndex);
        }
      }
    }
  }, [seriesList, selectedSeriesIndex]);
  
  // Initialize or reset draw selection when seriesDraws or totalDrawsCount changes
  useEffect(() => {
    if ((totalDrawsCount !== undefined && totalDrawsCount <= 0) || !seriesDraws || seriesDraws.length === 0) {
      if (selectedDrawId !== undefined) setSelectedDrawIdInternal(undefined);
      return;
    }
    if (seriesDraws && seriesDraws.length > 0 && selectedDrawId === undefined) {
      let savedDrawId: number | undefined = undefined;
      try {
        const savedSelection = localStorage.getItem('lottery_selection');
        if (savedSelection) {
          const { drawId, seriesIndex } = JSON.parse(savedSelection);
          if (seriesIndex === selectedSeriesIndex && drawId !== undefined && seriesDraws.some(d => d.drawId === drawId)) {
            savedDrawId = drawId;
          }
        }
      } catch (e) {}
      if (savedDrawId !== undefined && savedDrawId !== selectedDrawId) {
        setSelectedDrawIdInternal(savedDrawId);
      } else {
        const draw1 = seriesDraws.find(draw => draw.drawId === 1);
        if (draw1 && selectedDrawId !== 1) {
          setSelectedDrawIdInternal(1);
        } else {
          const activeDraws = seriesDraws.filter(draw => !draw.completed);
          if (activeDraws.length > 0) {
            const oldestActiveDraw = activeDraws.sort((a, b) => a.drawId - b.drawId)[0];
            if (selectedDrawId !== oldestActiveDraw.drawId) setSelectedDrawIdInternal(oldestActiveDraw.drawId);
          } else {
            const oldestDraw = seriesDraws.sort((a, b) => a.drawId - b.drawId)[0];
            if (selectedDrawId !== oldestDraw.drawId) setSelectedDrawIdInternal(oldestDraw.drawId);
          }
        }
      }
    }
  }, [seriesDraws, selectedDrawId, totalDrawsCount, selectedSeriesIndex]);
  
  // Memoize ticket price calculation
  const ticketPriceFromFunction = useMemo(() => {
    if (!seriesDraws || !selectedDrawId) return '0';
    const selectedDraw = seriesDraws.find(draw => draw.drawId === selectedDrawId);
    return selectedDraw ? selectedDraw.ticketPrice : '0';
  }, [seriesDraws, selectedDrawId]);
  
  // Memoize updated lottery data
  const updatedLotteryData = useMemo(() => {
    if (!lotteryData) return {
      jackpotAmount: "0",
      ticketPrice: "0",
      currentDraw: 0,
      timeRemaining: 0,
      participants: [],
      participantCount: 0,
      seriesIndex: selectedSeriesIndex || 0
    };
    return {
      ...lotteryData,
      ticketPrice: lotteryData.ticketPrice || ticketPriceFromFunction
    };
  }, [lotteryData, ticketPriceFromFunction, selectedSeriesIndex]);
  
  // Utility function to check if draws are available
  const isDrawAvailable = useCallback(() => {
    // Check both data and errors to determine if draws are available
    if (lotteryError || seriesDrawsError || !lotteryData || !provider) {
      return false;
    }
    
    // Check if the selected series has available draws
    if (selectedSeriesIndex === undefined) {
      return false;
    }
    
    // Basic check for draw availability
    const basicCheck = totalDrawsCount !== undefined && 
                       totalDrawsCount > 0 && 
                       seriesDraws && 
                       seriesDraws.length > 0;
                       
    if (!basicCheck) {
      return false;
    }
                       
    // Check if we have active draws for the selected series
    const hasActiveDrawsForSeries = seriesDraws.some(draw => draw.drawId > 0 && !draw.completed);
    
    return hasActiveDrawsForSeries;
  }, [totalDrawsCount, seriesDraws, lotteryError, seriesDrawsError, lotteryData, provider, selectedSeriesIndex]);
  
  // For backward compatibility
  const areDrawsAvailable = isDrawAvailable;
  const hasAvailableDraws = isDrawAvailable;
  
  // Get the ticket price for the currently selected draw
  const getSelectedDrawTicketPrice = useCallback(() => {
    if (!isDrawAvailable() || !seriesDraws || !selectedDrawId) {
      console.log("Cannot get price - draws not available, or no seriesDraws, or no selectedDrawId");
      return "0";
    }
    
    console.log("Series draws:", seriesDraws);
    console.log("Looking for draw ID:", selectedDrawId);
    
    const selectedDraw = seriesDraws.find(draw => draw.drawId === selectedDrawId);
    console.log("Selected draw:", selectedDraw);
    
    if (selectedDraw) {
      console.log("Ticket price from selected draw:", selectedDraw.ticketPrice);
      return selectedDraw.ticketPrice;
    }
    
    console.log("No matching draw found, returning 0");
    return "0";
  }, [isDrawAvailable, seriesDraws, selectedDrawId]);
  
  return {
    lotteryData: updatedLotteryData,
    isLoadingLotteryData,
    lotteryError,
    timeRemaining: timeRemaining || { days: 0, hours: 0, minutes: 0, seconds: 0 },
    seriesList,
    isLoadingSeriesList,
    seriesDraws,
    isLoadingSeriesDraws,
    totalDrawsCount,
    isLoadingTotalDrawsCount,
    selectedSeriesIndex,
    selectedDrawId,
    setSelectedSeriesIndex,
    setSelectedDrawId,
    currentLottery,
    isLoadingCurrentLottery,
    currentLotteryError,
    participants: participants || [],
    isLoadingParticipants,
    participantsError,
    drawParticipants: drawParticipants || [],
    isLoadingDrawParticipants,
    drawParticipantsError,
    refetchDrawParticipants,
    enhancedRefetchParticipants,
    pastWinners,
    isLoadingPastWinners,
    pastWinnersError,
    buyTickets,
    buyQuickPickTicket,
    buyMultipleQuickPickTickets,
    buyMultipleTicketsMutation,
    buyCustomTicket,
    generateQuickPick,
    isBuyingTickets: buyTicketMutation.isPending || buyMultipleTicketsMutation.isPending,
    refreshSeriesData,
    formatUSD,
    refetchLotteryData,
    refetchSeriesDraws,
    areDrawsAvailable: isDrawAvailable,
    hasAvailableDraws: isDrawAvailable,
    getSelectedDrawTicketPrice: () => ticketPriceFromFunction
  };
}
