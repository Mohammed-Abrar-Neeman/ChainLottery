import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getLotteryData, 
  LotteryData, 
  formatTimeRemaining, 
  generateQuickPick,
  buyLotteryTicket 
} from '@/lib/lotteryContract';
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
  
  // Mutation for buying lottery ticket
  const buyTicketMutation = useMutation({
    mutationFn: async ({ numbers, lottoNumber }: { numbers: number[], lottoNumber: number }) => {
      if (!provider || !chainId) {
        throw new Error('Wallet not connected');
      }
      
      // Execute the blockchain transaction
      const result = await buyLotteryTicket(provider, chainId, numbers, lottoNumber);
      
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
  const buyQuickPickTicket = useCallback(async () => {
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
      return await buyTicketMutation.mutateAsync(quickPick);
    } catch (error) {
      console.error('Error buying quick pick ticket:', error);
      return { success: false, txHash: null };
    }
  }, [buyTicketMutation, isConnected]);
  
  // Function to buy a custom number ticket
  const buyCustomTicket = useCallback(async (numbers: number[], lottoNumber: number) => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to buy tickets.",
        variant: "destructive"
      });
      return { success: false, txHash: null };
    }
    
    try {
      return await buyTicketMutation.mutateAsync({ numbers, lottoNumber });
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
    
    // Buy a single quick pick ticket
    return await buyQuickPickTicket();
  }, [buyQuickPickTicket]);
  
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
    buyTickets, // For backward compatibility
    buyQuickPickTicket,
    buyCustomTicket,
    generateQuickPick,
    isBuyingTickets: buyTicketMutation.isPending,
    formatUSD,
    refetchLotteryData
  };
}
