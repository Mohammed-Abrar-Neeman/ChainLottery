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
import { useAppKitAccount } from '@reown/appkit/react';

export default function Home() {
  console.log('=== Home Component Render ===');
  
  const queryClient = useQueryClient();
  const { isConnected, address } = useAppKitAccount();
  console.log('Wallet connection status:', { isConnected, address });

  const {
    getContract,
    getLotteryData,
    getSeriesList,
    getSeriesDraws,
    buyTicket,
    generateQuickPick
  } = useLotteryContract();

  // State management
  const [homeSeriesIndex, setHomeSeriesIndex] = useState<number | undefined>(undefined);
  const [homeDrawId, setHomeDrawId] = useState<number | undefined>(undefined);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Effect to handle wallet connection
  useEffect(() => {
    console.log('=== Wallet Connection Effect ===');
    console.log('isConnected:', isConnected);
    console.log('address:', address);
    
    if (isConnected && address) {
      console.log('Wallet connected, resetting state...');
      setHomeSeriesIndex(undefined);
      setHomeDrawId(undefined);
      setIsInitialLoad(false);
    }
  }, [isConnected, address]);

  // Fetch series list
  const { data: seriesList, isLoading: isSeriesListLoading } = useQuery({
    queryKey: ['seriesList'],
    queryFn: async () => {
      console.log('=== Fetching Series List ===');
      console.log('Address:', address);
      
      try {
        const result = await getSeriesList();
        console.log('Series list result:', result);
        return result;
      } catch (error) {
        console.error('Error fetching series list:', error);
        throw error;
      }
    },
    staleTime: 60000,
    retry: 3,
    retryDelay: 1000
  });

  // Set initial series index
  useEffect(() => {
    console.log('=== Series List Effect ===');
    console.log('Series list:', seriesList);
    console.log('Current homeSeriesIndex:', homeSeriesIndex);
    console.log('Is initial load:', isInitialLoad);
    
    if (seriesList && seriesList.length > 0 && homeSeriesIndex === undefined) {
      console.log('Setting initial series index:', seriesList[0].index);
      setHomeSeriesIndex(seriesList[0].index);
      setIsInitialLoad(false);
    }
  }, [seriesList, homeSeriesIndex]);

  // Fetch draws for selected series
  const { data: seriesDraws, isLoading: isSeriesDrawsLoading } = useQuery({
    queryKey: ['seriesDraws', homeSeriesIndex],
    queryFn: async () => {
      console.log('=== Fetching Series Draws ===');
      console.log('Series index:', homeSeriesIndex);
      console.log('Address:', address);
      
      try {
        const result = await getSeriesDraws(homeSeriesIndex ?? 0);
        console.log('Series draws result:', result);
        return result;
      } catch (error) {
        console.error('Error fetching series draws:', error);
        throw error;
      }
    },
    enabled: homeSeriesIndex !== undefined,
    staleTime: 0,
    retry: 3,
    retryDelay: 1000
  });

  // Set initial draw id
  useEffect(() => {
    console.log('=== Series Draws Effect ===');
    console.log('Series draws:', seriesDraws);
    console.log('Current homeDrawId:', homeDrawId);
    console.log('Is initial load:', isInitialLoad);
    
    if (seriesDraws && seriesDraws.length > 0 && homeDrawId === undefined) {
      console.log('Setting initial draw ID:', seriesDraws[0].drawId);
      setHomeDrawId(seriesDraws[0].drawId);
    }
  }, [seriesDraws, homeDrawId]);

  // Fetch lottery data
  const { data: lotteryData, isLoading: isLotteryDataLoading } = useQuery({
    queryKey: ['lotteryData', homeSeriesIndex, homeDrawId],
    queryFn: async () => {
      console.log('=== Fetching Lottery Data ===');
      console.log('Series index:', homeSeriesIndex);
      console.log('Draw ID:', homeDrawId);
      console.log('Address:', address);
      
      try {
        const result = await getLotteryData(homeSeriesIndex, homeDrawId);
        console.log('Lottery data result:', result);
        return result;
      } catch (error) {
        console.error('Error fetching lottery data:', error);
        throw error;
      }
    },
    enabled: homeSeriesIndex !== undefined && homeDrawId !== undefined,
    staleTime: 0,
    retry: 3,
    retryDelay: 1000
  });

  // Custom setter for home series index
  const handleHomeSeriesIndexChange: React.Dispatch<React.SetStateAction<number | undefined>> = async (value) => {
    const newSeriesIndex = typeof value === 'function' ? value(homeSeriesIndex) : value;
    console.log('=== Series Index Change ===');
    console.log('New series index:', newSeriesIndex);
    
    setHomeSeriesIndex(newSeriesIndex);
    setHomeDrawId(undefined);
  };

  const isDataLoading = isSeriesListLoading || isSeriesDrawsLoading || isLotteryDataLoading || isInitialLoad;

  console.log('=== Home Component State ===');
  console.log('Series list:', seriesList);
  console.log('Series draws:', seriesDraws);
  console.log('Home series index:', homeSeriesIndex);
  console.log('Home draw ID:', homeDrawId);
  console.log('Is loading:', isDataLoading);
  console.log('Is initial load:', isInitialLoad);

  return (
    <>
      <HeroBanner
        seriesList={seriesList || []}
        seriesDraws={seriesDraws || []}
        sharedSeriesIndex={homeSeriesIndex}
        setSharedSeriesIndex={handleHomeSeriesIndexChange}
        sharedDrawId={homeDrawId}
        setSharedDrawId={setHomeDrawId}
        isLoading={isDataLoading}
      />
      <LotteryStats
        sharedSeriesIndex={homeSeriesIndex}
        sharedDrawId={homeDrawId}
      />
      <BuyTickets
        sharedSeriesIndex={homeSeriesIndex}
        setSharedSeriesIndex={handleHomeSeriesIndexChange}
        sharedDrawId={homeDrawId}
        setSharedDrawId={setHomeDrawId}
      />
      <ParticipantsList
        sharedSeriesIndex={homeSeriesIndex}
        sharedDrawId={homeDrawId}
      />
      <PastWinners
        sharedSeriesIndex={homeSeriesIndex}
        sharedDrawId={homeDrawId}
      />
      <FAQSection />
    </>
  );
}
