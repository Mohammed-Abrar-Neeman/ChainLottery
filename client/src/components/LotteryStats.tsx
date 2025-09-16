import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLotteryContract } from '@/hooks/useLotteryContract';
import { Ticket, DollarSign, Users, History } from 'lucide-react';
import { ethers } from 'ethers';
import { useAppKitAccount } from '@reown/appkit/react';
import { useEthPrice } from "@/hooks/useEthPrice";

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



export default function LotteryStats({ sharedSeriesIndex, sharedDrawId }: LotteryStatsProps) {
  const { getLotteryData, getSeriesDraws } = useLotteryContract();
  const { address, isConnected } = useAppKitAccount();
  const maticPrice = useEthPrice();

  // Utility function to format USD
const formatUSD = (maticAmount: string) => {
  if (maticPrice === undefined) return <span className="inline-flex items-center"><svg className="animate-spin h-4 w-4 mr-1 text-gray-400" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Loading...</span>;
  if (maticPrice === null) return 'Unavailable';
  const usdAmount = parseFloat(maticAmount) * maticPrice;
  return `$${usdAmount.toFixed(5)}`;
};

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
    if (!sharedDrawId || !lotteryData) return null; // or return undefined
    return sharedDrawId;
  };

  // Get values from lottery data
  const ticketPrice = lotteryData?.ticketPrice || "0.0";
  const jackpotAmount = lotteryData?.jackpotAmount || "0.0";
  const currentRound = getCurrentRound() ?? 0;
  const participantCount = lotteryData?.participantCount || 0;

  // Calculate time remaining
  const timeRemaining = lotteryData?.timeRemaining ? {
    days: Math.floor(lotteryData.timeRemaining / (24 * 60 * 60)),
    hours: Math.floor((lotteryData.timeRemaining % (24 * 60 * 60)) / (60 * 60)),
    minutes: Math.floor((lotteryData.timeRemaining % (60 * 60)) / 60)
  } : undefined;


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
            <h3 className="ml-4 text-xl font-semibold">Tickets Sold</h3>
          </div>
          <p className="lotto-number text-3xl">
            {participantCount > 0 ? participantCount : 'No Data'}
          </p>
          {/* <p className="text-gray-600 text-sm">Unique participants</p> */}
        </div>
        
        <div className="glass rounded-2xl shadow-glass p-6">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-yellow-500 bg-opacity-20 flex items-center justify-center text-yellow-500">
              <History className="h-6 w-6" />
            </div>
            <h3 className="ml-4 text-xl font-semibold">Round</h3>
          </div>
          <p className="lotto-number text-3xl">
            {currentRound > 0 ? `#${currentRound}` : 'No Data'}
          </p>
          <p className="text-gray-600 text-sm">
  {currentRound
    ? (timeRemaining && timeRemaining.days === 0 && timeRemaining.hours === 0 && timeRemaining.minutes === 0 
        ? 'Draw completed' 
        : timeRemaining && (timeRemaining.days > 0 || timeRemaining.hours > 0 || timeRemaining.minutes > 0)
          ? `Ends in ${formatTimeRemaining()}`
          : 'Time Ended')
    : ''}
</p>
        </div>
      </div>
    </section>
  );
}