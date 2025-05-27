import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import HeroBanner from '@/components/HeroBanner';
import LotteryStats from '@/components/LotteryStats';
import BuyTickets from '@/components/BuyTickets';
import ParticipantsList from '@/components/ParticipantsList';
import PastWinners from '@/components/PastWinners';
import FAQSection from '@/components/FAQSection';
import { useLotteryContract } from '@/hooks/useLotteryContract';
import { toast } from '@/hooks/use-toast';

export default function Home() {
  const queryClient = useQueryClient();
  const { 
    getContract,
    getLotteryData, 
    getSeriesList, 
    getSeriesDraws, 
    buyTicket, 
    generateQuickPick,
    isConnected 
  } = useLotteryContract();

  // State management
  const [homeSeriesIndex, setHomeSeriesIndex] = useState<number | undefined>(0);
  const [homeDrawId, setHomeDrawId] = useState<number | undefined>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Effect to refresh data when series or draw ID changes
  useEffect(() => {
    if (homeSeriesIndex !== undefined) {
      queryClient.invalidateQueries({ queryKey: ['lotteryData'] });
      queryClient.invalidateQueries({ queryKey: ['seriesDraws'] });
    }
  }, [homeSeriesIndex, homeDrawId, queryClient]);

  // Custom setter for home series index
  const handleHomeSeriesIndexChange: React.Dispatch<React.SetStateAction<number | undefined>> = async (value) => {
    const newSeriesIndex = typeof value === 'function' ? value(homeSeriesIndex) : value;
    console.log("Home - Setting series index:", newSeriesIndex);
    
    if (newSeriesIndex === undefined) {
      setHomeSeriesIndex(undefined);
      setHomeDrawId(undefined);
      return;
    }

    setIsLoading(true);
    try {
      // Get the contract instance
      const contract = await getContract();
      if (!contract) {
        toast({
          title: "Error",
          description: "Failed to connect to contract",
          variant: "destructive"
        });
        return;
      }

      // Get draw IDs for the selected series
      const drawIds = await contract.getSeriesDrawIdsByIndex(newSeriesIndex);
      
      if (drawIds.length === 0) {
        setHomeSeriesIndex(newSeriesIndex);
        setHomeDrawId(undefined);
        return;
      }

      // Find the next available draw ID
      let nextDrawId: number | undefined;
      for (const drawId of drawIds) {
        const completed = await contract.getCompleted(drawId);
        if (!completed) {
          nextDrawId = Number(drawId);
          break;
        }
      }

      // If no next draw is found (all draws are completed), set to undefined
      setHomeSeriesIndex(newSeriesIndex);
      setHomeDrawId(nextDrawId);

      // Show toast if all draws are completed
      if (nextDrawId === undefined) {
        toast({
          title: "No Active Draws",
          description: "All draws in this series are completed. Please check back later for new draws.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error setting series index:', error);
      toast({
        title: "Error",
        description: "Failed to get series draws",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Queries
  const { data: seriesList } = useQuery({
    queryKey: ['seriesList'],
    queryFn: getSeriesList,
    staleTime: 60000,
  });

  const { data: lotteryData, isLoading: isLotteryDataLoading } = useQuery({
    queryKey: ['lotteryData', homeSeriesIndex, homeDrawId],
    queryFn: () => getLotteryData(homeSeriesIndex, homeDrawId),
    enabled: homeSeriesIndex !== undefined && homeDrawId !== undefined,
    staleTime: 0, // Always fetch fresh data
  });

  const { data: seriesDraws, isLoading: isSeriesDrawsLoading } = useQuery({
    queryKey: ['seriesDraws', homeSeriesIndex],
    queryFn: () => getSeriesDraws(homeSeriesIndex ?? 0),
    enabled: homeSeriesIndex !== undefined,
    staleTime: 0, // Always fetch fresh data
  });

  // Handle ticket purchase
  const handleBuyTicket = async (ticketCount: number) => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to buy tickets.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { numbers, lottoNumber } = generateQuickPick();
      const result = await buyTicket(numbers, lottoNumber, homeSeriesIndex, homeDrawId);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Ticket purchased successfully!",
        });
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['lotteryData'] });
        queryClient.invalidateQueries({ queryKey: ['seriesDraws'] });
      }
    } catch (error) {
      console.error('Error buying ticket:', error);
      toast({
        title: "Error",
        description: "Failed to buy ticket",
        variant: "destructive"
      });
    }
  };

  const isDataLoading = isLoading || isLotteryDataLoading || isSeriesDrawsLoading;

  return (
    <>
      <HeroBanner 
        sharedSeriesIndex={homeSeriesIndex}
        setSharedSeriesIndex={handleHomeSeriesIndexChange}
        sharedDrawId={homeDrawId}
        setSharedDrawId={setHomeDrawId}
        isLoading={isDataLoading}
      />
      <LotteryStats 
        sharedSeriesIndex={homeSeriesIndex}
        sharedDrawId={homeDrawId}
        isLoading={isDataLoading}
      />
      <BuyTickets 
        sharedSeriesIndex={homeSeriesIndex}
        setSharedSeriesIndex={handleHomeSeriesIndexChange}
        sharedDrawId={homeDrawId}
        setSharedDrawId={setHomeDrawId}
        isLoading={isDataLoading}
      />
      <ParticipantsList 
        sharedSeriesIndex={homeSeriesIndex}
        sharedDrawId={homeDrawId}
        isLoading={isDataLoading}
      />
      <PastWinners 
        sharedSeriesIndex={homeSeriesIndex}
        sharedDrawId={homeDrawId} 
        isLoading={isDataLoading}
      />
      <FAQSection />
    </>
  );
}
