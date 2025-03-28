import React from 'react';
import { useLotteryData } from '@/hooks/useLotteryData';
import { Ticket, DollarSign, Users, History } from 'lucide-react';

export default function LotteryStats() {
  const { lotteryData, timeRemaining, formatUSD } = useLotteryData();
  
  // Format time remaining as string
  const formatTimeRemaining = () => {
    return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
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
          <p className="font-mono text-3xl font-bold">{lotteryData?.ticketPrice || '0.01'} ETH</p>
          <p className="text-gray-600 text-sm">
            ≈ {formatUSD(lotteryData?.ticketPrice || '0.01')}
          </p>
        </div>
        
        <div className="glass rounded-2xl shadow-glass p-6">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-accent bg-opacity-20 flex items-center justify-center text-accent">
              <DollarSign className="h-6 w-6" />
            </div>
            <h3 className="ml-4 text-xl font-semibold">Total Value</h3>
          </div>
          <p className="font-mono text-3xl font-bold">{lotteryData?.jackpotAmount || '3.457'} ETH</p>
          <p className="text-gray-600 text-sm">
            ≈ {formatUSD(lotteryData?.jackpotAmount || '3.457')}
          </p>
        </div>
        
        <div className="glass rounded-2xl shadow-glass p-6">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center text-green-500">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="ml-4 text-xl font-semibold">Players</h3>
          </div>
          <p className="font-mono text-3xl font-bold">{lotteryData?.participantCount || 157}</p>
          <p className="text-gray-600 text-sm">Unique participants</p>
        </div>
        
        <div className="glass rounded-2xl shadow-glass p-6">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-yellow-500 bg-opacity-20 flex items-center justify-center text-yellow-500">
              <History className="h-6 w-6" />
            </div>
            <h3 className="ml-4 text-xl font-semibold">Round</h3>
          </div>
          <p className="font-mono text-3xl font-bold">#{lotteryData?.currentRound || 42}</p>
          <p className="text-gray-600 text-sm">Ends in {formatTimeRemaining()}</p>
        </div>
      </div>
    </section>
  );
}
