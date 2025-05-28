import React, { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ExternalLink, RefreshCcw, Trophy } from 'lucide-react';
import { formatAddress } from '@/lib/utils';
import { useLotteryContract } from '@/hooks/useLotteryContract';

// Utility function for formatting USD amounts
const formatUSD = (ethAmount: string): string => {
  try {
    const amount = parseFloat(ethAmount);
    if (isNaN(amount)) return '$0.00';
    
    // Assuming 1 ETH = $3,000 (this would be dynamic in production)
    const usdValue = amount * 3000;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(usdValue);
  } catch (e) {
    return '$0.00';
  }
};

export interface Winner {
  winnerAddress: string;
  amountWon: string;
  drawId?: number;
  seriesIndex?: number;
  timestamp?: number;
  winningNumbers?: number[];
  transactionHash?: string;
}

interface PastWinnersProps {
  sharedDrawId?: number;
  sharedSeriesIndex?: number;
  isLoading?: boolean;
}

export default function PastWinners({ sharedDrawId, sharedSeriesIndex, isLoading: parentIsLoading }: PastWinnersProps) {
  const { getLotteryData } = useLotteryContract();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawCompleted, setIsDrawCompleted] = useState(false);
  
  // Track previous values to detect changes
  const [previousDrawId, setPreviousDrawId] = useState<number | undefined>();
  const [previousSeriesIndex, setPreviousSeriesIndex] = useState<number | undefined>();

  // Define refreshWinners function
  const refreshWinners = useCallback((forceReset = false) => {
    if (!sharedDrawId) return;

    // Reset state when force is true
    if (forceReset) {
      setWinners([]);
      setPreviousDrawId(undefined);
      setPreviousSeriesIndex(undefined);
    }
    
    setIsLoading(true);
    setError(null);
    
    console.log(`PastWinners - Manual refresh triggered for Series ${sharedSeriesIndex}, Draw ${sharedDrawId}`);
    
    // Fetch lottery data
    getLotteryData(sharedSeriesIndex, sharedDrawId)
      .then(lotteryData => {
        if (!lotteryData) {
          setWinners([]);
          setIsDrawCompleted(false);
          return;
        }

        setIsDrawCompleted(true);
        
        // Create a winner entry with the data from lotteryData
        const winner: Winner = {
          winnerAddress: lotteryData.winnerAddress || '0x0000000000000000000000000000000000000000',
          amountWon: lotteryData.jackpotAmount,
          drawId: sharedDrawId,
          seriesIndex: sharedSeriesIndex,
          timestamp: lotteryData.endTimestamp,
          winningNumbers: lotteryData.winningTicketNumbers,
          transactionHash: lotteryData.transactionHash
        };

        // Check if we have valid winning numbers (not all zeros)
        const hasValidWinningNumbers = lotteryData.winningTicketNumbers && 
          lotteryData.winningTicketNumbers.length > 0 && 
          lotteryData.winningTicketNumbers.some(num => num > 0);

        if (hasValidWinningNumbers) {
          setWinners([winner]);
        } else {
          setWinners([]);
        }
      })
      .catch(error => {
        console.error('Error refreshing winners:', error);
        setError('Failed to refresh winner data. Please try again later.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [getLotteryData, sharedSeriesIndex, sharedDrawId]);

  // Load winners for the selected draw - refresh on prop changes
  useEffect(() => {
    if (!sharedDrawId) return;

    // Check if there was a change in series or draw
    const seriesChanged = previousSeriesIndex !== sharedSeriesIndex;
    const drawIdChanged = previousDrawId !== sharedDrawId;
    
    if (seriesChanged || drawIdChanged) {
      console.log(`PastWinners - Series or Draw ID changed, refreshing data`);
      setPreviousSeriesIndex(sharedSeriesIndex);
      setPreviousDrawId(sharedDrawId);
      refreshWinners(true);
    }
  }, [sharedDrawId, sharedSeriesIndex, refreshWinners, previousSeriesIndex, previousDrawId]);
  
  // Helper for time formatting
  const getTimeDifference = (timestamp: number | undefined) => {
    if (!timestamp) return "Unknown time";
    
    const now = Date.now();
    const diffHours = Math.floor((now - timestamp) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    }
  };

  // Use parent loading state if provided
  const isLoadingState = parentIsLoading || isLoading;

  return (
    <section className="mb-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Past Winners</h2>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refreshWinners()} 
          disabled={isLoadingState}
          className="flex items-center"
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${isLoadingState ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {!isLoadingState && winners.length === 0 ? (
        <Alert variant="default" className="mb-6">
          <div className="flex items-start gap-2">
            <Trophy className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <AlertDescription className="flex-1">
              <span className="font-semibold">Winner Yet To Be Declared</span> 
              <p className="mt-1">This draw hasn't completed yet. Winners will be displayed here after the draw concludes.</p>
            </AlertDescription>
          </div>
        </Alert>
      ) : (
        <>
          {isLoadingState ? (
            <div className="max-w-xl mx-auto">
              <div className="glass rounded-xl shadow-glass overflow-hidden">
                <Skeleton className="h-12 w-full" />
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-8 w-full mb-3" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto">
              {winners.map((winner, index) => (
                <div key={`${winner.winnerAddress}-${index}`} className="glass rounded-xl shadow-glass overflow-hidden">
                  <div className="bg-primary/10 border-b border-primary/20 p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Draw #{winner.drawId || sharedDrawId}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-4">
                      <div className="text-sm text-white/70 mb-1">Prize Amount</div>
                      <div className="crypto-value text-xl text-primary">{winner.amountWon} ETH</div>
                    </div>
                    
                    {winner.winningNumbers && winner.winningNumbers.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm text-white/70 mb-1">Winning Numbers</div>
                        <div className="flex flex-wrap gap-1.5">
                          {/* Display first 5 numbers */}
                          {winner.winningNumbers.slice(0, 5).map((num, i) => (
                            <span 
                              key={`winning-number-${i}`} 
                              className="inline-flex items-center justify-center w-7 h-7 text-sm lotto-number rounded-full bg-green-800/30 text-green-400 border border-green-500/40"
                            >
                              {num}
                            </span>
                          ))}
                          {/* Display lotto number (6th number) */}
                          {winner.winningNumbers.length >= 6 && (
                            <span 
                              className="inline-flex items-center justify-center w-7 h-7 text-sm lotto-number rounded-full bg-yellow-800/30 text-yellow-400 border border-yellow-500/40"
                            >
                              {winner.winningNumbers[5]}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {winner.transactionHash && (
                      <div className="flex justify-end">
                        <a 
                          href={`https://testnet.bscscan.com/tx/${winner.transactionHash}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-accent transition flex items-center text-sm"
                        >
                          View on Explorer <ExternalLink className="ml-1 h-3.5 w-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}