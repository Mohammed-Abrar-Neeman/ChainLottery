import { useCallback, useState } from 'react';
import { useLotteryContract } from './useLotteryContract';
import { useAppKitAccount } from "@reown/appkit/react";

export interface LotteryHistoryData {
  drawId: number;
  seriesIndex: number;
  endTime: Date;
  poolAmount: string;
  participantCount: number;
  winnerAddress: string;
  transactionHash: string;
  winningNumbers?: number[];
  prizeAmount: string;
}

export function useLotteryHistory() {
  const { address, isConnected } = useAppKitAccount();
  const { getLotteryData } = useLotteryContract();
  const [history, setHistory] = useState<LotteryHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDrawHistory = useCallback(async (seriesIndex: number, drawId: number) => {
    if (!isConnected) {
      console.warn("Wallet not connected, cannot fetch history");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const lotteryData = await getLotteryData(seriesIndex, drawId);
      
      if (!lotteryData) {
        console.log(`No data found for Series ${seriesIndex}, Draw ${drawId}`);
        return null;
      }

      const historyEntry: LotteryHistoryData = {
        drawId,
        seriesIndex,
        endTime: new Date(lotteryData.endTimestamp * 1000),
        poolAmount: lotteryData.jackpotAmount,
        participantCount: lotteryData.totalTicketsSold,
        winnerAddress: lotteryData.winnerAddress,
        transactionHash: lotteryData.transactionHash || '',
        winningNumbers: lotteryData.winningTicketNumbers,
        prizeAmount: lotteryData.jackpotAmount
      };

      setHistory(prev => {
        // Don't add duplicates
        const exists = prev.some(h => 
          h.drawId === drawId && 
          h.seriesIndex === seriesIndex
        );
        if (exists) return prev;
        return [...prev, historyEntry];
      });

      return historyEntry;
    } catch (error) {
      console.error('Error fetching draw history:', error);
      setError('Failed to fetch draw history');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getLotteryData, isConnected]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setError(null);
  }, []);

  return {
    history,
    isLoading,
    error,
    fetchDrawHistory,
    clearHistory
  };
} 