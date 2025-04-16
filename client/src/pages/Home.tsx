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
  
  // Custom setter for home series index that also handles special cases
  const handleHomeSeriesIndexChange: React.Dispatch<React.SetStateAction<number | undefined>> = (value) => {
    const newSeriesIndex = typeof value === 'function' ? value(homeSeriesIndex) : value;
    console.log("Home - Setting series index with special handling:", newSeriesIndex);
    
    // INTERMEDIATE SERIES SPECIAL HANDLING:
    // We add this code first and then set the state to ensure the special case is handled immediately
    if (newSeriesIndex === 1) { // Series 1 (Intermediate)
      console.log("🔄 INTERMEDIATE SERIES DETECTED - FORCING SPECIAL HANDLING!");
      console.log("Home - Setting special draw ID 2 for Intermediate series");
      
      // Set the state values in this specific order:
      setHomeSeriesIndex(1);
      setHomeDrawId(2);
      
      // Also force the lottery data values directly for immediate consistency
      setLotteryDataSeriesIndex(1);
      setLotteryDataDrawId(2);
      
      // Force a refresh to ensure all components re-render with the new values
      setRefreshTrigger(prev => prev + 1);
      
      // Force participants data refetch
      setTimeout(() => {
        console.log("🔄 Forcing refresh of participants for Intermediate series");
        refetchDrawParticipants(); // Refetch without explicit parameters to avoid type errors
      }, 50);
      
      return; // Skip the default state setting as we handled it specifically
    }
    
    // Default handling for other series
    setHomeSeriesIndex(newSeriesIndex);
  }
  
  // Force refresh state when parameters change to ensure UI updates correctly
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
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
      
      // Force refresh when series changes
      setRefreshTrigger(prev => prev + 1);
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
      
      // Force refresh when draw changes
      setRefreshTrigger(prev => prev + 1);
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
        setSharedSeriesIndex={handleHomeSeriesIndexChange}
        sharedDrawId={homeDrawId}
        setSharedDrawId={setHomeDrawId}
        key={`hero-${refreshTrigger}-${homeSeriesIndex}-${homeDrawId}`}
      />
      {/* Pass the shared state to LotteryStats */}
      <LotteryStats 
        sharedSeriesIndex={homeSeriesIndex}
        sharedDrawId={homeDrawId}
        key={`stats-${refreshTrigger}-${homeSeriesIndex}-${homeDrawId}`}
      />
      {/* Pass the shared state and update functions to BuyTickets */}
      <BuyTickets 
        sharedSeriesIndex={homeSeriesIndex}
        setSharedSeriesIndex={handleHomeSeriesIndexChange}
        sharedDrawId={homeDrawId}
        setSharedDrawId={setHomeDrawId}
        key={`buy-${refreshTrigger}-${homeSeriesIndex}-${homeDrawId}`}
      />
      <ParticipantsList 
        sharedSeriesIndex={homeSeriesIndex}
        // Special handling for Intermediate Series (1) to always force Draw ID 2
        sharedDrawId={homeSeriesIndex === 1 ? 2 : homeDrawId}
        key={`participants-${refreshTrigger}-${homeSeriesIndex}-${homeDrawId}`}
      />
      <PastWinners 
        sharedSeriesIndex={homeSeriesIndex}
        sharedDrawId={homeDrawId} 
        key={`winners-${refreshTrigger}-${homeSeriesIndex}-${homeDrawId}`}
      />
      <FAQSection />
    </>
  );
}
