import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLotteryContract } from '@/hooks/useLotteryContract';
import { Ticket, DollarSign, Users, History } from 'lucide-react';
import { ethers } from 'ethers';
import { useAppKitAccount } from '@reown/appkit/react';

// Add prop types for shared state
interface LotteryStatsProps {
  sharedSeriesIndex?: number;
  sharedDrawId?: number;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
}

// Utility function to format USD
const formatUSD = (ethAmount: string) => {
  const ethPrice = 2000; // TODO: Get this from an API
  const usdAmount = parseFloat(ethAmount) * ethPrice;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(usdAmount);
};

export default function LotteryStats({ sharedSeriesIndex, sharedDrawId }: LotteryStatsProps) {
  const { getLotteryData, getSeriesDraws } = useLotteryContract();
  const { address, isConnected } = useAppKitAccount();

  // Fetch lottery data for the selected series and draw
  const { data: lotteryData } = useQuery({
    queryKey: ['lotteryData', sharedSeriesIndex, sharedDrawId],
    queryFn: () => getLotteryData(sharedSeriesIndex, sharedDrawId),
    enabled: sharedSeriesIndex !== undefined && sharedDrawId !== undefined,
    staleTime: 0,
  });

  // Fetch series draws for the selected series
  const { data: seriesDraws } = useQuery({
    queryKey: ['seriesDraws', sharedSeriesIndex],
    queryFn: () => getSeriesDraws(sharedSeriesIndex ?? 0),
    enabled: sharedSeriesIndex !== undefined,
    staleTime: 0,
  });

  // Get the selected draw data
  const selectedDraw = React.useMemo(() => {
    if (!isConnected || !seriesDraws || !sharedDrawId) return null;
    return seriesDraws.find(draw => draw.drawId === sharedDrawId);
  }, [isConnected, seriesDraws, sharedDrawId]);

  // Format time remaining as string
  const formatTimeRemaining = () => {
    if (!isConnected || !lotteryData?.timeRemaining) {
      return "1d 12h 30m";
    }

    // Convert seconds to days, hours, minutes
    const totalSeconds = lotteryData.timeRemaining;
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  };

  // Get the current round number
  const getCurrentRound = () => {
    if (!sharedDrawId) return 1;
    return sharedDrawId;
  };

  // Get values from lottery data
  const ticketPrice = lotteryData?.ticketPrice || "0.0";
  const jackpotAmount = lotteryData?.jackpotAmount || "0.0";
  const currentRound = getCurrentRound();
  const participantCount = lotteryData?.participantCount || 0;

  // Calculate time remaining
  const timeRemaining = lotteryData?.timeRemaining ? {
    days: Math.floor(lotteryData.timeRemaining / (24 * 60 * 60)),
    hours: Math.floor((lotteryData.timeRemaining % (24 * 60 * 60)) / (60 * 60)),
    minutes: Math.floor((lotteryData.timeRemaining % (60 * 60)) / 60)
  } : undefined;

  // Log values for debugging
  console.log('LotteryStats - Updated values:', {
    ticketPrice,
    jackpotAmount,
    currentRound,
    participantCount,
    selectedDraw,
    sharedDrawId,
    lotteryData
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
            {selectedDraw && currentRound > 0 ? `#${currentRound}` : 'No Data'}
          </p>
          <p className="text-gray-600 text-sm">
            {timeRemaining && timeRemaining.days === 0 && timeRemaining.hours === 0 && timeRemaining.minutes === 0 
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