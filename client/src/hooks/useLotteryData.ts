import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLotteryData, LotteryData, buyLotteryTickets, formatTimeRemaining } from '@/lib/lotteryContract';
import { apiRequest } from '@/lib/queryClient';
import { useWallet } from '@/hooks/useWallet';
import { toast } from '@/hooks/use-toast';

export function useLotteryData() {
  const { provider, chainId, account, isConnected } = useWallet();
  const queryClient = useQueryClient();
  
  // Query for fetching lottery data from smart contract
  const { 
    data: lotteryData,
    isLoading: isLoadingLotteryData,
    error: lotteryError,
    refetch: refetchLotteryData
  } = useQuery({
    queryKey: ['lotteryData', chainId],
    queryFn: async () => {
      if (!provider || !chainId) return null;
      return await getLotteryData(provider, chainId);
    },
    enabled: !!provider && !!chainId,
    refetchInterval: 30000 // Refetch every 30 seconds
  });
  
  // Convert timeRemaining to hours, minutes, seconds
  const timeRemaining = lotteryData?.timeRemaining 
    ? formatTimeRemaining(lotteryData.timeRemaining)
    : { hours: 11, minutes: 46, seconds: 29 }; // Default fallback
  
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
  
  // Mutation for buying tickets
  const buyTicketsMutation = useMutation({
    mutationFn: async ({ ticketCount }: { ticketCount: number }) => {
      if (!provider || !chainId) {
        throw new Error('Wallet not connected');
      }
      
      // Execute the blockchain transaction
      const result = await buyLotteryTickets(provider, chainId, ticketCount);
      
      if (!result.success || !result.txHash || !account) {
        throw new Error('Transaction failed');
      }
      
      // Record the purchase in the backend
      if (participants?.id) {
        await apiRequest('POST', '/api/lottery/record-purchase', {
          roundId: participants.id,
          walletAddress: account,
          ticketCount,
          transactionHash: result.txHash
        });
      }
      
      return { success: true, txHash: result.txHash };
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
  
  // Function to buy tickets
  const buyTickets = useCallback(async (ticketCount: number) => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to buy tickets.",
        variant: "destructive"
      });
      return { success: false, txHash: null };
    }
    
    try {
      return await buyTicketsMutation.mutateAsync({ ticketCount });
    } catch (error) {
      console.error('Error buying tickets:', error);
      return { success: false, txHash: null };
    }
  }, [buyTicketsMutation, isConnected]);
  
  // Format USD values
  const formatUSD = useCallback((ethValue: string) => {
    // Using a fixed ETH price for simplicity
    // In a real app, you would fetch the current ETH price from an API
    const ethPrice = 2388.67;
    const usdValue = parseFloat(ethValue) * ethPrice;
    return `$${usdValue.toFixed(2)}`;
  }, []);
  
  return {
    lotteryData,
    isLoadingLotteryData,
    lotteryError,
    timeRemaining,
    currentLottery,
    isLoadingCurrentLottery,
    currentLotteryError,
    participants,
    isLoadingParticipants,
    participantsError,
    pastWinners,
    isLoadingPastWinners,
    pastWinnersError,
    buyTickets,
    isBuyingTickets: buyTicketsMutation.isPending,
    formatUSD,
    refetchLotteryData
  };
}
