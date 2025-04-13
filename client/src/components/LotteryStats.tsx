import React from 'react';
import { useLotteryData } from '@/hooks/useLotteryData';
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
  
  // Use the shared state values from props if provided
  const selectedSeriesIndex = sharedSeriesIndex !== undefined ? sharedSeriesIndex : _selectedSeriesIndex;
  const selectedDrawId = sharedDrawId !== undefined ? sharedDrawId : _selectedDrawId;
  
  // Format time remaining as string
  const formatTimeRemaining = () => {
    if (timeRemaining.days > 0) {
      return `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    }
    return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
  };
  
  // Get the selected draw data from seriesDraws
  const getSelectedDraw = () => {
    if (!isDrawAvailable() || !seriesDraws || !selectedDrawId) {
      return null;
    }
    
    return seriesDraws.find(draw => draw.drawId === selectedDrawId);
  };
  
  // Get the jackpot amount based on the shared draw ID
  const getJackpotAmount = () => {
    const selectedDraw = getSelectedDraw();
    return selectedDraw ? selectedDraw.jackpot : "0";
  };
  
  // Get the ticket price based on the shared draw ID
  const getTicketPrice = () => {
    const selectedDraw = getSelectedDraw();
    return selectedDraw ? selectedDraw.ticketPrice : "0";
  };
  
  // Get the current draw number based on the shared draw ID
  const getCurrentDraw = () => {
    return selectedDrawId || 0;
  };
  
  // Get participants count for the selected draw
  const getParticipantCount = () => {
    // Get participant count directly from the lottery data from the smart contract
    return defaultLotteryData?.participantCount || 0;
  };
  
  // Re-calculate values when selected draw changes
  const ticketPrice = getTicketPrice();
  const jackpotAmount = getJackpotAmount();
  const currentDraw = getCurrentDraw();
  const participantCount = getParticipantCount();
  
  // Create lottery data with the selected draw values
  const lotteryData = {
    ...defaultLotteryData,
    jackpotAmount: jackpotAmount,
    ticketPrice: ticketPrice,
    currentDraw: currentDraw,
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
      currentDraw
    });
  }, [selectedDrawId, ticketPrice, jackpotAmount, currentDraw]);
  
  // Log the values for debugging
  console.log('LotteryStats - Updated values:', {
    ticketPrice,
    jackpotAmount,
    currentDraw,
    participantCount,
    drawAvailable: isDrawAvailable(),
    selectedDrawId,
    sharedDrawId
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
          <p className="font-mono text-3xl font-bold">
            {isDrawAvailable() ? 
              parseFloat(ticketPrice || '0').toFixed(5) // Always display ticket price with 5 decimal places
              : '0.00000'} ETH
          </p>
          <p className="text-gray-600 text-sm">
            ≈ {formatUSD(isDrawAvailable() ? ticketPrice : '0')}
          </p>
        </div>
        
        <div className="glass rounded-2xl shadow-glass p-6">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-accent bg-opacity-20 flex items-center justify-center text-accent">
              <DollarSign className="h-6 w-6" />
            </div>
            <h3 className="ml-4 text-xl font-semibold">Total Value</h3>
          </div>
          <p className="font-mono text-3xl font-bold">
            {isDrawAvailable() 
              ? parseFloat(jackpotAmount || '0').toFixed(5) // Always display jackpot with 5 decimal places
              : '0.00000'} ETH
          </p>
          <p className="text-gray-600 text-sm">
            ≈ {formatUSD(isDrawAvailable() ? jackpotAmount || '0' : '0')}
          </p>
        </div>
        
        <div className="glass rounded-2xl shadow-glass p-6">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center text-green-500">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="ml-4 text-xl font-semibold">Players</h3>
          </div>
          <p className="font-mono text-3xl font-bold">
            {isDrawAvailable() ? lotteryData?.participantCount || '0' : '0'}
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
          <p className="font-mono text-3xl font-bold">
            #{isDrawAvailable() ? currentDraw || '0' : '0'}
          </p>
          <p className="text-gray-600 text-sm">
            {isDrawAvailable() ? `Ends in ${formatTimeRemaining()}` : 'No active draw'}
          </p>
        </div>
      </div>
    </section>
  );
}
