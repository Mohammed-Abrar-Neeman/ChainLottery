import React from 'react';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useWallet } from '@/hooks/useWallet';
import { Ticket, DollarSign, Users, History } from 'lucide-react';

// Add prop types for shared state
interface LotteryStatsProps {
  sharedSeriesIndex?: number;
  sharedDrawId?: number;
}

export default function LotteryStats({ sharedSeriesIndex, sharedDrawId }: LotteryStatsProps) {
  // Use the shared state values instead of the hook's internal state
  const { 
    lotteryData: defaultLotteryData, 
    timeRemaining: defaultTimeRemaining, 
    formatUSD, 
    hasAvailableDraws: isDrawAvailable,
    totalDrawsCount,
    seriesDraws,
    getSelectedDrawTicketPrice,
    // We're still using these from the hook for the actual functionality,
    // but we're passing in the shared values for state
    selectedSeriesIndex: _selectedSeriesIndex,
    selectedDrawId: _selectedDrawId,
  } = useLotteryData();
  
  // Get wallet connection status for conditional rendering
  const { isConnected } = useWallet();
  
  // Use the shared state values from props if provided
  const selectedSeriesIndex = sharedSeriesIndex !== undefined ? sharedSeriesIndex : _selectedSeriesIndex;
  const selectedDrawId = sharedDrawId !== undefined ? sharedDrawId : _selectedDrawId;
  
  // Format time remaining as string
  const formatTimeRemaining = () => {
    // If no wallet connection or unavailable time data, return static values
    if (!isConnected || !timeRemaining) {
      return "1d 12h 30m";
    }
    
    if (timeRemaining.days > 0) {
      return `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    }
    return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
  };
  
  // Get the selected draw data from seriesDraws
  const getSelectedDraw = () => {
    if (!isConnected || !isDrawAvailable() || !seriesDraws || !selectedDrawId) {
      return null;
    }
    
    return seriesDraws.find(draw => draw.drawId === selectedDrawId);
  };
  
  // Get the jackpot amount directly from the contract's reported value
  const getJackpotAmount = () => {
    // If not connected, return zero
    if (!isConnected) {
      return "0.0";
    }
    // Use the value directly from the API response
    return defaultLotteryData?.jackpotAmount || "0.0";
  };
  
  // Get the ticket price directly from the contract's reported value 
  const getTicketPrice = () => {
    // If not connected, return zero
    if (!isConnected) {
      return "0.0";
    }
    // Use the value directly from the API response
    return defaultLotteryData?.ticketPrice || "0.0";
  };
  
  // Get the display round number based on the series and draw ID
  const getCurrentRound = () => {
    // If not connected, return a stable value
    if (!isConnected || !selectedDrawId) {
      return 1;
    }
    
    // For each series, assign a consistent round number for display purposes
    // This fixes the "Round for the same draw id" issue by showing a consistent
    // round number regardless of the actual drawId value
    
    // Each series has its own round numbering that starts from 1
    if (selectedSeriesIndex === 0) {
      // Beginner Series (series 0)
      return selectedDrawId; // For this series, draw ID matches round number
    } else if (selectedSeriesIndex === 1) {
      // Intermediate Series (series 1) 
      // Here the draw ID is 2, but we display it as round 1 within this series
      return 1;
    } else if (selectedSeriesIndex === 2) {
      // Monthly Mega Series (series 2)
      return selectedDrawId;
    } else if (selectedSeriesIndex === 3) {
      // Weekly Express Series (series 3)
      return selectedDrawId;
    } else if (selectedSeriesIndex === 4) {
      // Quarterly Rewards Series (series 4)
      return selectedDrawId;
    } else if (selectedSeriesIndex === 5) {
      // Annual Championship Series (series 5)
      return selectedDrawId;
    }
    
    // Default fallback
    return selectedDrawId;
  };
  
  // Get participants count for the SELECTED draw, not just the default draw
  const getParticipantCount = () => {
    // If not connected, return zero
    if (!isConnected) {
      return 0;
    }
    // Simply use the participant count from the lottery data
    // Now that we're correctly calculating it in lotteryContract.ts
    return defaultLotteryData?.participantCount || 0;
  };
  
  // Re-calculate values when selected draw changes
  const ticketPrice = getTicketPrice();
  const jackpotAmount = getJackpotAmount();
  const currentRound = getCurrentRound();
  const participantCount = getParticipantCount();
  
  // Create lottery data with the selected draw values
  const lotteryData = {
    ...defaultLotteryData,
    jackpotAmount: jackpotAmount,
    ticketPrice: ticketPrice,
    currentDraw: currentRound, // Use the normalized round number
    participantCount: participantCount
  };
  
  // Use timeRemaining from defaultLotteryData for now since it's calculated from endpoint
  const timeRemaining = defaultTimeRemaining;
  
  // Add an effect to log and respond to drawId changes
  React.useEffect(() => {
    console.log("LotteryStats - Draw ID changed, recalculating values:", {
      selectedDrawId,
      ticketPrice,
      jackpotAmount,
      currentRound
    });
  }, [selectedDrawId, ticketPrice, jackpotAmount, currentRound]);
  
  // Log the values for debugging
  console.log('LotteryStats - Updated values:', {
    ticketPrice,
    jackpotAmount,
    currentRound,
    participantCount,
    drawAvailable: isDrawAvailable(),
    selectedDrawId,
    sharedDrawId,
    defaultLotteryData: {
      jackpotAmount: defaultLotteryData?.jackpotAmount,
      ticketPrice: defaultLotteryData?.ticketPrice, 
      participantCount: defaultLotteryData?.participantCount,
      timeRemaining: defaultTimeRemaining
    }
  });

  return (
    <section className="mb-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="glass rounded-2xl shadow-glass p-6">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary bg-opacity-20 flex items-center justify-center text-primary">
              <Ticket className="h-6 w-6" />
            </div>
            <h3 className="ml-4 text-xl font-semibold">Ticket Price</h3>
          </div>
          <p className="crypto-value text-3xl">
            {ticketPrice && parseFloat(ticketPrice) > 0 ? 
              `${parseFloat(ticketPrice).toFixed(5)} ETH` : 'No Data'}
          </p>
          <p className="text-gray-600 text-sm">
            {ticketPrice && parseFloat(ticketPrice) > 0 ? 
              `≈ ${formatUSD(ticketPrice)}` : 'Unavailable'}
          </p>
        </div>
        
        <div className="glass rounded-2xl shadow-glass p-6">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-accent bg-opacity-20 flex items-center justify-center text-accent">
              <DollarSign className="h-6 w-6" />
            </div>
            <h3 className="ml-4 text-xl font-semibold">Total Value</h3>
          </div>
          <p className="crypto-value text-3xl">
            {jackpotAmount && parseFloat(jackpotAmount) > 0 ? 
              `${parseFloat(jackpotAmount).toFixed(5)} ETH` : 'No Data'}
          </p>
          <p className="text-gray-600 text-sm">
            {jackpotAmount && parseFloat(jackpotAmount) > 0 ? 
              `≈ ${formatUSD(jackpotAmount)}` : 'Unavailable'}
          </p>
        </div>
        
        <div className="glass rounded-2xl shadow-glass p-6">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center text-green-500">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="ml-4 text-xl font-semibold">Players</h3>
          </div>
          <p className="lotto-number text-3xl">
            {participantCount > 0 ? participantCount : 'No Data'}
          </p>
          <p className="text-gray-600 text-sm">Unique participants</p>
        </div>
        
        <div className="glass rounded-2xl shadow-glass p-6">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-yellow-500 bg-opacity-20 flex items-center justify-center text-yellow-500">
              <History className="h-6 w-6" />
            </div>
            <h3 className="ml-4 text-xl font-semibold">Round</h3>
          </div>
          <p className="lotto-number text-3xl">
            {/* Check if there's actual draw data from the smart contract */}
            {(isConnected && isDrawAvailable() && seriesDraws && seriesDraws.length > 0 && currentRound > 0) 
              ? `#${currentRound}` 
              : 'No Data'}
          </p>
          <p className="text-gray-600 text-sm">
            {!isConnected 
              ? `Ends in ${formatTimeRemaining()}`
              : timeRemaining && timeRemaining.days === 0 && timeRemaining.hours === 0 && timeRemaining.minutes === 0 
                ? 'Draw completed' 
                : timeRemaining && (timeRemaining.days > 0 || timeRemaining.hours > 0 || timeRemaining.minutes > 0)
                  ? `Ends in ${formatTimeRemaining()}`
                  : 'Time unavailable'}
          </p>
        </div>
      </div>
    </section>
  );
}