import { useCallback, useState } from 'react';
import { useLotteryContract } from './useLotteryContract';
import { useAppKitAccount } from "@reown/appkit/react";

export interface LotterySeries {
  index: number;
  name: string;
  isActive: boolean;
}

export interface LotteryDraw {
  drawId: number;
  seriesIndex: number;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
}

export function useLotterySeries() {
  const { address, isConnected } = useAppKitAccount();
  const { getLotteryData } = useLotteryContract();
  const [seriesList, setSeriesList] = useState<LotterySeries[]>([]);
  const [seriesDraws, setSeriesDraws] = useState<LotteryDraw[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSeriesList = useCallback(async () => {
    if (!isConnected) {
      console.warn("Wallet not connected, cannot fetch series list");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // For now, we'll just create a default series
      // In the future, this should fetch from the contract
      const defaultSeries: LotterySeries = {
        index: 0,
        name: "Main Series",
        isActive: true
      };

      setSeriesList([defaultSeries]);
    } catch (error) {
      console.error('Error fetching series list:', error);
      setError('Failed to fetch series list');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  const fetchSeriesDraws = useCallback(async (seriesIndex: number) => {
    if (!isConnected) {
      console.warn("Wallet not connected, cannot fetch series draws");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // For now, we'll create a sample draw
      // In the future, this should fetch from the contract
      const sampleDraw: LotteryDraw = {
        drawId: 1,
        seriesIndex,
        startTime: new Date(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        isActive: true
      };

      setSeriesDraws([sampleDraw]);
    } catch (error) {
      console.error('Error fetching series draws:', error);
      setError('Failed to fetch series draws');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  return {
    seriesList,
    seriesDraws,
    isLoading,
    error,
    fetchSeriesList,
    fetchSeriesDraws
  };
} 