import React from 'react';
import { useLotteryData } from '@/hooks/useLotteryData';
import { Ticket, DollarSign, Users, History } from 'lucide-react';

export default function LotteryStats() {
  const { 
    lotteryData, 
    timeRemaining, 
    formatUSD, 
    areDrawsAvailable,
    selectedSeriesIndex,
    totalDrawsCount,
    seriesDraws
  } = useLotteryData();
  
  // Format time remaining as string
  const formatTimeRemaining = () => {
    if (timeRemaining.days > 0) {
      return `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    }
    return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
  };
  
  // Enhanced check for draw availability - specifically focused on the selected series
  const hasAvailableDraws = () => {
    // First check if draws are available overall
    if (!areDrawsAvailable()) {
      return false;
    }
    
    // Then check if the selected series has available draws
    return (
      totalDrawsCount !== undefined && 
      totalDrawsCount > 0 && 
      seriesDraws && 
      seriesDraws.length > 0 &&
      lotteryData
    );
  };
  
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
            {hasAvailableDraws() ? (parseFloat(lotteryData?.ticketPrice || '0').toFixed(4)) : '0.0000'} ETH
          </p>
          <p className="text-gray-600 text-sm">
            ≈ {formatUSD(hasAvailableDraws() ? lotteryData?.ticketPrice || '0' : '0')}
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
            {hasAvailableDraws() ? (parseFloat(lotteryData?.jackpotAmount || '0').toFixed(4)) : '0.0000'} ETH
          </p>
          <p className="text-gray-600 text-sm">
            ≈ {formatUSD(hasAvailableDraws() ? lotteryData?.jackpotAmount || '0' : '0')}
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
            {hasAvailableDraws() ? lotteryData?.participantCount || '0' : '0'}
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
            #{hasAvailableDraws() ? lotteryData?.currentDraw || '0' : '0'}
          </p>
          <p className="text-gray-600 text-sm">
            {hasAvailableDraws() ? `Ends in ${formatTimeRemaining()}` : 'No active draw'}
          </p>
        </div>
      </div>
    </section>
  );
}
