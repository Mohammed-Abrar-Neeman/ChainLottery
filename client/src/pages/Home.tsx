import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import HeroBanner from '@/components/HeroBanner';
import LotteryStats from '@/components/LotteryStats';
import BuyTickets from '@/components/BuyTickets';
import PastWinners from '@/components/PastWinners';
import FAQSection from '@/components/FAQSection';
import { useLotteryContract } from '@/hooks/useLotteryContract';
import { useAppKitAccount } from '@reown/appkit/react';

export default function Home() {
  const { isConnected, address } = useAppKitAccount();

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
    
    if (isConnected && address) {
      setHomeSeriesIndex(undefined);
      setHomeDrawId(undefined);
      setIsInitialLoad(false);
    }
  }, [isConnected, address]);

  // Fetch series list
  const { data: seriesList, isLoading: isSeriesListLoading } = useQuery({
    queryKey: ['seriesList'],
    queryFn: async () => {
      
      try {
        const result = await getSeriesList();
        return result;
      } catch (error) {
        throw error;
      }
    },
    staleTime: 60000,
    retry: 3,
    retryDelay: 1000
  });

  // Set initial series index
  useEffect(() => {
    
    if (seriesList && seriesList.length > 0 && homeSeriesIndex === undefined) {
      setHomeSeriesIndex(seriesList[0].index);
      setIsInitialLoad(false);
    }
  }, [seriesList, homeSeriesIndex]);

  // Fetch draws for selected series
  const { data: seriesDraws, isLoading: isSeriesDrawsLoading } = useQuery({
    queryKey: ['seriesDraws', homeSeriesIndex],
    queryFn: async () => {
      
      try {
        const result = await getSeriesDraws(homeSeriesIndex ?? 0);
        return result;
      } catch (error) {
        throw error;
      }
    },
    enabled: homeSeriesIndex !== undefined,
    staleTime: 0,
    retry: 3,
    retryDelay: 1000
  });

  // Effect to set initial draw ID
  useEffect(() => {

    if (!seriesDraws || seriesDraws.length === 0) return;

    // Only set initial draw ID if we don't already have one
    if (homeDrawId === undefined) {
      // Find active draw first
      const activeDraw = seriesDraws.find(draw => !draw.completed && draw.drawId !== 0);
      
      if (activeDraw) {
        setHomeDrawId(activeDraw.drawId);
      } else {
        // If no active draw, find the latest completed draw
        const completedDraws = seriesDraws
          .filter(draw => draw.drawId !== 0 && draw.completed)
          .sort((a, b) => b.drawId - a.drawId);

        if (completedDraws.length > 0) {
          setHomeDrawId(completedDraws[0].drawId);
        }
      }
    }
  }, [seriesDraws, homeDrawId, isInitialLoad]);

  // Fetch lottery data
  const { data: lotteryData, isLoading: isLotteryDataLoading } = useQuery({
    queryKey: ['lotteryData', homeSeriesIndex, homeDrawId],
    queryFn: async () => {
      
      try {
        const result = await getLotteryData(homeSeriesIndex, homeDrawId);
        return result;
      } catch (error) {
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
    
    setHomeSeriesIndex(newSeriesIndex);
    setHomeDrawId(undefined);
  };

  const isDataLoading = isSeriesListLoading || isSeriesDrawsLoading || isLotteryDataLoading || isInitialLoad;


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
        homeDrawId={homeDrawId}
        setHomeDrawId={setHomeDrawId}
        isInitialLoad={isInitialLoad}
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
      {/* <ParticipantsList
        sharedSeriesIndex={homeSeriesIndex}
        sharedDrawId={homeDrawId}
      /> */}
      <PastWinners
        sharedSeriesIndex={homeSeriesIndex}
        sharedDrawId={homeDrawId}
      />
      <FAQSection />
    </>
  );
}
