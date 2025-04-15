import React, { useState, useEffect } from 'react';
import HeroBanner from '@/components/HeroBanner';
import LotteryStats from '@/components/LotteryStats';
import BuyTickets from '@/components/BuyTickets';
import ParticipantsList from '@/components/ParticipantsList';
import PastWinners from '@/components/PastWinners';
import FAQSection from '@/components/FAQSection';
import { useLotteryData } from '@/hooks/useLotteryData';

export default function Home() {
  // Create state at the Home component level instead of using useLotteryData directly
  // This will be the single source of truth for all child components
  const [homeSeriesIndex, setHomeSeriesIndex] = useState<number | undefined>(0); // Default to series 0
  const [homeDrawId, setHomeDrawId] = useState<number | undefined>(1); // Default to draw 1
  
  // Set up API listener for debug mode draw selection
  useEffect(() => {
    const checkForDebugDrawSelection = async () => {
      try {
        // Check if there's a debug draw ID selection
        const response = await fetch('/api/debug/current-selection');
        if (response.ok) {
          const data = await response.json();
          if (data.drawId && data.drawId !== homeDrawId) {
            console.log("Debug API changed draw ID to:", data.drawId);
            setHomeDrawId(data.drawId);
          }
        }
      } catch (error) {
        // Silently ignore errors as this is just a debug feature
      }
    };
    
    // Check once on component mount
    checkForDebugDrawSelection();
    
    // Check periodically for changes
    const interval = setInterval(checkForDebugDrawSelection, 5000);
    return () => clearInterval(interval);
  }, [homeDrawId]);
  
  // Get lottery data access to initialize our state
  const {
    seriesList,
    selectedSeriesIndex,
    setSelectedSeriesIndex: setLotteryDataSeriesIndex,
    selectedDrawId,
    setSelectedDrawId: setLotteryDataDrawId,
    refetchDrawParticipants,
    // Other lottery data props will be re-fetched in child components
  } = useLotteryData();

  // IMPORTANT: Only allow ONE direction of synchronization to prevent circular updates
  // We make Home.tsx the source of truth, and only push changes from Home → useLotteryData
  // This creates a clear, one-way data flow to prevent flickering
  
  // When our home state changes, update the lottery data state
  useEffect(() => {
    // Only update if the values are different and not undefined
    if (homeSeriesIndex !== undefined && homeSeriesIndex !== selectedSeriesIndex) {
      console.log("Home - Updating lottery data series index from home:", { 
        from: selectedSeriesIndex, 
        to: homeSeriesIndex 
      });
      setLotteryDataSeriesIndex(homeSeriesIndex);
    }
    
    if (homeDrawId !== undefined && homeDrawId !== selectedDrawId) {
      console.log("Home - Updating lottery data draw ID from home:", { 
        from: selectedDrawId, 
        to: homeDrawId 
      });
      // Update the draw ID without triggering additional updates
      setLotteryDataDrawId(homeDrawId);
      
      // Important: Force refetch of participants data when draw ID changes
      console.log("Home - Refetching participants data for draw ID:", homeDrawId);
      
      // The refetch is now direct with no timeout to ensure immediate data update
      refetchDrawParticipants();
    }
  }, [homeSeriesIndex, homeDrawId, selectedDrawId, selectedSeriesIndex, setLotteryDataSeriesIndex, setLotteryDataDrawId, refetchDrawParticipants]);

  // Debug log for state changes
  console.log("Home component - shared lottery state:", { 
    homeSeriesIndex, 
    homeDrawId
  });

  return (
    <>
      <HeroBanner 
        sharedSeriesIndex={homeSeriesIndex}
        setSharedSeriesIndex={setHomeSeriesIndex}
        sharedDrawId={homeDrawId}
        setSharedDrawId={setHomeDrawId}
      />
      {/* Pass the shared state to LotteryStats */}
      <LotteryStats 
        sharedSeriesIndex={homeSeriesIndex}
        sharedDrawId={homeDrawId}
      />
      {/* Pass the shared state and update functions to BuyTickets */}
      <BuyTickets 
        sharedSeriesIndex={homeSeriesIndex}
        setSharedSeriesIndex={setHomeSeriesIndex}
        sharedDrawId={homeDrawId}
        setSharedDrawId={setHomeDrawId}
      />
      <ParticipantsList 
        sharedSeriesIndex={homeSeriesIndex}
        sharedDrawId={homeDrawId} 
      />
      <PastWinners sharedDrawId={homeDrawId} />
      <FAQSection />
    </>
  );
}
