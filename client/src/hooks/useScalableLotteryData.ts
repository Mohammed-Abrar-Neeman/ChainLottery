import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from './useWallet';
import { ethers } from 'ethers';
import { getLotteryAddress } from '@shared/contracts';
import { lotteryABI } from '@shared/lotteryABI';
import { 
  getFromCache, 
  saveToCache, 
  cacheLotteryDraw, 
  cacheLotteryParticipants,
  invalidateSeriesCache
} from '@/lib/cacheService';

// Type definitions for better typing
export interface LotteryDraw {
  id: number;
  drawId: number;
  seriesIndex: number;
  seriesName: string;
  startTime: Date;
  endTime: Date;
  isCompleted: boolean;
  jackpotAmount: string;
  ticketPrice: string;
  participantCount: number;
  winningNumbers?: number[];
  winnerAddress?: string;
  prizeAmount?: string;
  transactionHash?: string;
}

export interface LotteryTicket {
  ticketId: string;
  walletAddress: string;
  numbers: number[];
  lottoNumber: number;
  timestamp: number;
  drawId: number;
  seriesIndex: number;
  isWinner?: boolean;
}

export interface SeriesInfo {
  index: number;
  name: string;
  drawIds: number[];
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// Parameters for data fetching
interface FetchParams {
  seriesIndex?: number;
  drawId?: number;
  walletAddress?: string;
  retry?: number;
  forceRefresh?: boolean;
  page?: number;
  pageSize?: number;
}

// Default fetch parameters
const DEFAULT_FETCH_PARAMS: FetchParams = {
  retry: 3,
  forceRefresh: false,
  page: 1,
  pageSize: 10
};

// Define error states for better error handling
type ErrorState = {
  message: string;
  code?: string;
  retry?: () => void;
};

/**
 * A scalable hook for handling lottery data with caching and pagination
 */
export function useScalableLotteryData() {
  const { provider, account: walletAddress } = useWallet();
  
  // State management
  const [seriesList, setSeriesList] = useState<SeriesInfo[]>([]);
  const [draws, setDraws] = useState<Record<string, LotteryDraw[]>>({});
  const [participants, setParticipants] = useState<Record<string, LotteryTicket[]>>({});
  const [selectedSeriesIndex, setSelectedSeriesIndex] = useState<number | undefined>();
  const [selectedDrawId, setSelectedDrawId] = useState<number | undefined>();
  const [errors, setErrors] = useState<Record<string, ErrorState>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState<Record<string, PaginationOptions>>({});
  
  // Initialize contract instance
  const contractInstance = useMemo(() => {
    if (!provider) return null;
    
    try {
      const lotteryAddress = getLotteryAddress();
      return new ethers.Contract(lotteryAddress, lotteryABI, provider);
    } catch (error) {
      console.error("Failed to initialize contract:", error);
      return null;
    }
  }, [provider]);
  
  /**
   * Set a loading state with a unique key
   */
  const setLoadingState = useCallback((key: string, isLoading: boolean) => {
    setIsLoading(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);
  
  /**
   * Handle errors with retry functionality
   */
  const handleError = useCallback((
    key: string, 
    message: string, 
    code?: string, 
    retryFn?: () => void
  ) => {
    setErrors(prev => ({
      ...prev,
      [key]: {
        message,
        code,
        retry: retryFn
      }
    }));
  }, []);
  
  /**
   * Clear error for a specific key
   */
  const clearError = useCallback((key: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  }, []);
  
  /**
   * Get all available series with advanced error handling and caching
   */
  const fetchAllSeries = useCallback(async (params: FetchParams = {}) => {
    if (!contractInstance) {
      handleError('series', 'Contract not initialized');
      return [];
    }
    
    const loadingKey = 'series';
    setLoadingState(loadingKey, true);
    
    try {
      // Check cache first unless forceRefresh is true
      if (!params.forceRefresh) {
        const cachedSeries = getFromCache<SeriesInfo[]>('all_series');
        if (cachedSeries) {
          setSeriesList(cachedSeries);
          setLoadingState(loadingKey, false);
          return cachedSeries;
        }
      }
      
      // Fetch total series count
      const totalSeries = await contractInstance.getTotalSeries();
      const seriesCount = Number(totalSeries);
      
      // Prepare series list with parallel requests for better performance
      const seriesPromises = [];
      for (let i = 0; i < seriesCount; i++) {
        seriesPromises.push(fetchSeriesInfo(i));
      }
      
      // Use Promise.allSettled to handle partial failures
      const results = await Promise.allSettled(seriesPromises);
      
      // Filter successful results
      const seriesData = results
        .filter((result): result is PromiseFulfilledResult<SeriesInfo> => 
          result.status === 'fulfilled' && !!result.value
        )
        .map(result => result.value);
      
      // Log rejected promises for debugging
      results
        .filter((result): result is PromiseRejectedResult => 
          result.status === 'rejected'
        )
        .forEach(result => {
          console.error('Error fetching series:', result.reason);
        });
      
      // Update state and cache the result
      setSeriesList(seriesData);
      saveToCache('all_series', seriesData);
      clearError(loadingKey);
      
      return seriesData;
    } catch (error) {
      console.error('Error fetching all series:', error);
      handleError(
        loadingKey, 
        'Failed to fetch lottery series',
        undefined,
        () => fetchAllSeries(params)
      );
      return [];
    } finally {
      setLoadingState(loadingKey, false);
    }
  }, [contractInstance, handleError, setLoadingState, clearError]);
  
  /**
   * Get detailed information for a specific series
   */
  const fetchSeriesInfo = useCallback(async (
    seriesIndex: number
  ): Promise<SeriesInfo> => {
    if (!contractInstance) {
      throw new Error('Contract not initialized');
    }
    
    try {
      // Check cache first
      const cacheKey = `series_${seriesIndex}`;
      const cachedInfo = getFromCache<SeriesInfo>(cacheKey);
      if (cachedInfo) return cachedInfo;
      
      // Get series name
      const seriesName = await contractInstance.getSeriesNameByIndex(seriesIndex);
      
      // Get all draws in this series
      const drawIds = await contractInstance.getSeriesDrawIdsByIndex(seriesIndex);
      const processedDrawIds = drawIds.map((id: ethers.BigNumberish) => Number(id));
      
      const seriesInfo: SeriesInfo = {
        index: seriesIndex,
        name: seriesName,
        drawIds: processedDrawIds
      };
      
      // Cache the result
      saveToCache(cacheKey, seriesInfo);
      
      return seriesInfo;
    } catch (error) {
      console.error(`Error fetching series ${seriesIndex} info:`, error);
      throw error;
    }
  }, [contractInstance]);
  
  /**
   * Fetch draw data with caching and retries
   */
  const fetchDrawData = useCallback(async (
    seriesIndex: number,
    drawId: number,
    params: FetchParams = DEFAULT_FETCH_PARAMS
  ): Promise<LotteryDraw | null> => {
    if (!contractInstance) {
      handleError(`draw_${seriesIndex}_${drawId}`, 'Contract not initialized');
      return null;
    }
    
    const loadingKey = `draw_${seriesIndex}_${drawId}`;
    setLoadingState(loadingKey, true);
    
    try {
      // Check cache first unless forceRefresh is true
      if (!params.forceRefresh) {
        const cachedDraw = getFromCache<LotteryDraw>(`draw_${seriesIndex}_${drawId}`);
        if (cachedDraw) {
          // Update draws state
          setDraws(prev => ({
            ...prev,
            [`${seriesIndex}`]: [
              ...(prev[`${seriesIndex}`] || []).filter(d => d.drawId !== drawId),
              cachedDraw
            ]
          }));
          setLoadingState(loadingKey, false);
          clearError(loadingKey);
          return cachedDraw;
        }
      }
      
      // Try API first
      try {
        // Fetch from API
        const apiResponse = await fetch(`/api/lottery/series/${seriesIndex}/draws/${drawId}`);
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          
          // Convert API data to our format
          const draw: LotteryDraw = {
            id: apiData.id || 0,
            drawId: apiData.drawId || apiData.roundNumber || drawId,
            seriesIndex: apiData.seriesIndex !== undefined ? apiData.seriesIndex : seriesIndex,
            seriesName: apiData.seriesName || '',
            startTime: apiData.startTime ? new Date(apiData.startTime) : new Date(),
            endTime: apiData.endTime ? new Date(apiData.endTime) : new Date(),
            isCompleted: apiData.isCompleted || false,
            jackpotAmount: apiData.poolAmount || apiData.jackpotAmount || '0',
            ticketPrice: apiData.ticketPrice || '0',
            participantCount: apiData.participantCount || 0,
            winningNumbers: apiData.winningNumbers || [],
            winnerAddress: apiData.winnerAddress || '',
            prizeAmount: apiData.prizeAmount || '0',
            transactionHash: apiData.transactionHash || ''
          };
          
          // Cache the result
          cacheLotteryDraw(seriesIndex, drawId, draw, draw.isCompleted);
          
          // Update draws state
          setDraws(prev => ({
            ...prev,
            [`${seriesIndex}`]: [
              ...(prev[`${seriesIndex}`] || []).filter(d => d.drawId !== drawId),
              draw
            ]
          }));
          
          clearError(loadingKey);
          return draw;
        }
      } catch (apiError) {
        console.warn(`API fetch failed for series ${seriesIndex}, draw ${drawId}:`, apiError);
        // Continue to contract fetch if API fails
      }
      
      // Fallback to contract data
      console.log(`Fetching draw ${drawId} for series ${seriesIndex} from contract`);
      
      // Get series name for the draw
      let seriesName = '';
      try {
        seriesName = await contractInstance.getSeriesNameByIndex(seriesIndex);
      } catch (nameError) {
        console.warn(`Could not get series name for index ${seriesIndex}:`, nameError);
        seriesName = `Series #${seriesIndex}`;
      }
      
      // Get complete status
      let isCompleted = false;
      try {
        isCompleted = await contractInstance.getCompleted(drawId);
      } catch (error) {
        console.warn(`Could not get completion status for draw ${drawId}:`, error);
      }
      
      // Get estimated end time
      let endTime = new Date();
      try {
        const estimatedEndTime = await contractInstance.getEstimatedEndTime(drawId);
        endTime = new Date(Number(estimatedEndTime) * 1000);
      } catch (error) {
        console.warn(`Could not get end time for draw ${drawId}:`, error);
        // Fallback - set end time based on current time
        endTime = new Date();
        endTime.setDate(endTime.getDate() - (isCompleted ? 1 : -7)); // Past or future
      }
      
      // Get start time
      let startTime = new Date();
      try {
        const drawStartTime = await contractInstance.getDrawStartTime(drawId);
        startTime = new Date(Number(drawStartTime) * 1000);
      } catch (error) {
        console.warn(`Could not get start time for draw ${drawId}:`, error);
        // Fallback - set start time based on end time
        startTime = new Date(endTime);
        startTime.setDate(startTime.getDate() - 7); // 1 week before end time
      }
      
      // Get jackpot amount
      let jackpotAmount = '0';
      try {
        const jackpot = await contractInstance.getJackpot(drawId);
        jackpotAmount = ethers.formatEther(jackpot);
      } catch (error) {
        console.warn(`Could not get jackpot for draw ${drawId}:`, error);
      }
      
      // Get ticket price
      let ticketPrice = '0';
      try {
        const price = await contractInstance.getTicketPrice(drawId);
        ticketPrice = ethers.formatEther(price);
      } catch (error) {
        console.warn(`Could not get ticket price for draw ${drawId}:`, error);
      }
      
      // Get participant count
      let participantCount = 0;
      try {
        const ticketCount = await contractInstance.getTotalTicketsSold(drawId);
        participantCount = Number(ticketCount);
      } catch (error) {
        console.warn(`Could not get participant count for draw ${drawId}:`, error);
      }
      
      // Get winning numbers if draw is completed
      let winningNumbers: number[] = [];
      let winnerAddress = '';
      if (isCompleted) {
        try {
          const numbers = await contractInstance.getWinningNumbers(drawId);
          winningNumbers = numbers.map((num: ethers.BigNumberish) => Number(num));
        } catch (error) {
          console.warn(`Could not get winning numbers for draw ${drawId}:`, error);
        }
        
        try {
          const winner = await contractInstance.getWinner(drawId);
          winnerAddress = winner[0];
        } catch (error) {
          console.warn(`Could not get winner for draw ${drawId}:`, error);
        }
      }
      
      // Construct the draw data
      const draw: LotteryDraw = {
        id: 100 + drawId, // Use a different id range to avoid conflicts with API data
        drawId,
        seriesIndex,
        seriesName,
        startTime,
        endTime,
        isCompleted,
        jackpotAmount,
        ticketPrice,
        participantCount,
        winningNumbers,
        winnerAddress: winnerAddress || '0x0000000000000000000000000000000000000000',
        prizeAmount: jackpotAmount, // Default to jackpot amount
        transactionHash: '0x' + '0'.repeat(64) // Placeholder
      };
      
      // Cache the draw with TTL based on completion status
      cacheLotteryDraw(seriesIndex, drawId, draw, isCompleted);
      
      // Update draws state
      setDraws(prev => ({
        ...prev,
        [`${seriesIndex}`]: [
          ...(prev[`${seriesIndex}`] || []).filter(d => d.drawId !== drawId),
          draw
        ]
      }));
      
      clearError(loadingKey);
      return draw;
    } catch (error) {
      console.error(`Error fetching draw ${drawId} for series ${seriesIndex}:`, error);
      handleError(
        loadingKey, 
        `Failed to fetch draw #${drawId} data`,
        undefined,
        () => fetchDrawData(seriesIndex, drawId, params)
      );
      return null;
    } finally {
      setLoadingState(loadingKey, false);
    }
  }, [contractInstance, handleError, setLoadingState, clearError]);
  
  /**
   * Fetch participants for a specific draw with pagination
   */
  const fetchDrawParticipants = useCallback(async (
    seriesIndex: number,
    drawId: number,
    params: FetchParams = DEFAULT_FETCH_PARAMS
  ): Promise<LotteryTicket[]> => {
    if (!contractInstance) {
      handleError(`participants_${seriesIndex}_${drawId}`, 'Contract not initialized');
      return [];
    }
    
    const loadingKey = `participants_${seriesIndex}_${drawId}`;
    setLoadingState(loadingKey, true);
    
    try {
      // Get pagination parameters
      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      
      // Check cache first unless forceRefresh is true
      if (!params.forceRefresh) {
        const cachedParticipants = getFromCache<LotteryTicket[]>(`participants_${seriesIndex}_${drawId}`);
        if (cachedParticipants) {
          // Update participants state with paginated data
          const totalItems = cachedParticipants.length;
          const totalPages = Math.ceil(totalItems / pageSize);
          
          // Calculate page slice
          const startIndex = (page - 1) * pageSize;
          const endIndex = Math.min(startIndex + pageSize, totalItems);
          const paginatedParticipants = cachedParticipants.slice(startIndex, endIndex);
          
          // Update state
          setParticipants(prev => ({
            ...prev,
            [`${seriesIndex}_${drawId}`]: paginatedParticipants
          }));
          
          // Update pagination info
          setPagination(prev => ({
            ...prev,
            [`${seriesIndex}_${drawId}`]: {
              page,
              pageSize,
              totalItems,
              totalPages
            }
          }));
          
          setLoadingState(loadingKey, false);
          clearError(loadingKey);
          
          return paginatedParticipants;
        }
      }
      
      // Try API first
      try {
        const apiResponse = await fetch(`/api/lottery/${drawId}/participants`);
        if (apiResponse.ok) {
          const apiParticipants = await apiResponse.json();
          
          // Convert API data to our format
          const participants: LotteryTicket[] = apiParticipants.map((p: any) => ({
            ticketId: p.ticketId || `${drawId}-${p.id}`,
            walletAddress: p.walletAddress || '',
            numbers: p.numbers || [],
            lottoNumber: p.lottoNumber || 0,
            timestamp: p.timestamp || Date.now(),
            drawId: p.drawId || drawId,
            seriesIndex: p.seriesIndex !== undefined ? p.seriesIndex : seriesIndex
          }));
          
          // Cache all participants
          cacheLotteryParticipants(seriesIndex, drawId, participants);
          
          // Calculate pagination
          const totalItems = participants.length;
          const totalPages = Math.ceil(totalItems / pageSize);
          
          // Calculate page slice
          const startIndex = (page - 1) * pageSize;
          const endIndex = Math.min(startIndex + pageSize, totalItems);
          const paginatedParticipants = participants.slice(startIndex, endIndex);
          
          // Update state
          setParticipants(prev => ({
            ...prev,
            [`${seriesIndex}_${drawId}`]: paginatedParticipants
          }));
          
          // Update pagination info
          setPagination(prev => ({
            ...prev,
            [`${seriesIndex}_${drawId}`]: {
              page,
              pageSize,
              totalItems,
              totalPages
            }
          }));
          
          clearError(loadingKey);
          return paginatedParticipants;
        }
      } catch (apiError) {
        console.warn(`API participants fetch failed for draw ${drawId}:`, apiError);
        // Continue to contract fetch if API fails
      }
      
      // Fallback to contract data
      console.log(`Fetching participants for draw ${drawId} in series ${seriesIndex} from contract`);
      
      // Get total tickets sold first to know how many to fetch
      let ticketCount = 0;
      try {
        const count = await contractInstance.getTotalTicketsSold(drawId);
        ticketCount = Number(count);
      } catch (error) {
        console.warn(`Could not get ticket count for draw ${drawId}:`, error);
      }
      
      if (ticketCount === 0) {
        console.log(`No tickets sold for draw ${drawId}`);
        
        setParticipants(prev => ({
          ...prev,
          [`${seriesIndex}_${drawId}`]: []
        }));
        
        setPagination(prev => ({
          ...prev,
          [`${seriesIndex}_${drawId}`]: {
            page,
            pageSize,
            totalItems: 0,
            totalPages: 0
          }
        }));
        
        setLoadingState(loadingKey, false);
        clearError(loadingKey);
        return [];
      }
      
      console.log(`Contract reports ${ticketCount} tickets sold for draw #${drawId}`);
      
      // Collect all ticket data with concurrent requests in batches
      const participants: LotteryTicket[] = [];
      const batchSize = 5; // Process 5 tickets at a time to avoid overloading
      
      console.log(`Checking up to ${ticketCount} tickets for draw #${drawId}`);
      
      for (let i = 0; i < ticketCount; i += batchSize) {
        const batchPromises = [];
        for (let j = i; j < Math.min(i + batchSize, ticketCount); j++) {
          batchPromises.push(fetchTicketDetails(drawId, j));
        }
        
        // Wait for all promises in the batch
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Add successful results to participants array
        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            participants.push({
              ...result.value,
              seriesIndex
            });
          }
        });
      }
      
      console.log(`Found ${participants.length} participants by direct contract queries`);
      
      // Cache all participants
      cacheLotteryParticipants(seriesIndex, drawId, participants);
      
      // Calculate pagination
      const totalItems = participants.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      
      // Calculate page slice
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, totalItems);
      const paginatedParticipants = participants.slice(startIndex, endIndex);
      
      // Update state
      setParticipants(prev => ({
        ...prev,
        [`${seriesIndex}_${drawId}`]: paginatedParticipants
      }));
      
      // Update pagination info
      setPagination(prev => ({
        ...prev,
        [`${seriesIndex}_${drawId}`]: {
          page,
          pageSize,
          totalItems,
          totalPages
        }
      }));
      
      clearError(loadingKey);
      return paginatedParticipants;
    } catch (error) {
      console.error(`Error fetching participants for draw ${drawId}:`, error);
      handleError(
        loadingKey, 
        `Failed to fetch participants for draw #${drawId}`,
        undefined,
        () => fetchDrawParticipants(seriesIndex, drawId, params)
      );
      return [];
    } finally {
      setLoadingState(loadingKey, false);
    }
  }, [contractInstance, handleError, setLoadingState, clearError]);
  
  /**
   * Fetch details for a single ticket
   */
  const fetchTicketDetails = useCallback(async (
    drawId: number,
    ticketIndex: number
  ): Promise<LotteryTicket | null> => {
    if (!contractInstance) return null;
    
    try {
      const ticket = await contractInstance.getTicketDetails(drawId, ticketIndex);
      
      // Extract ticket details
      const walletAddress = ticket[0];
      const numbers = ticket[1].map((num: ethers.BigNumberish) => Number(num));
      const lottoNumber = Number(ticket[2]);
      const timestamp = Number(ticket[3]) * 1000;
      
      return {
        ticketId: `${drawId}-${ticketIndex}`,
        walletAddress,
        numbers,
        lottoNumber,
        timestamp,
        drawId,
        seriesIndex: 0 // Will be set by the calling function
      };
    } catch (error) {
      console.warn(`Error fetching ticket ${ticketIndex} for draw ${drawId}:`, error);
      return null;
    }
  }, [contractInstance]);
  
  /**
   * Get paginated draws for a specific series
   */
  const fetchSeriesDraws = useCallback(async (
    seriesIndex: number,
    params: FetchParams = DEFAULT_FETCH_PARAMS
  ): Promise<LotteryDraw[]> => {
    const loadingKey = `series_draws_${seriesIndex}`;
    setLoadingState(loadingKey, true);
    
    try {
      // Check if we have the series info with draw IDs
      let seriesInfo = seriesList.find(s => s.index === seriesIndex);
      
      if (!seriesInfo) {
        // Get series info if not available
        console.log(`Series info not found for index ${seriesIndex}, fetching...`);
        seriesInfo = await fetchSeriesInfo(seriesIndex);
      }
      
      if (!seriesInfo?.drawIds?.length) {
        console.log(`No draws found for series ${seriesIndex}`);
        setLoadingState(loadingKey, false);
        return [];
      }
      
      const { drawIds } = seriesInfo;
      console.log(`Series ${seriesIndex} has ${drawIds.length} draws:`, drawIds);
      
      // Get page details
      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      
      // Calculate pagination
      const totalItems = drawIds.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      
      // Get the draw IDs for this page
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, totalItems);
      const pageDrawIds = drawIds.slice(startIndex, endIndex);
      
      // Fetch draws data in parallel
      const drawPromises = pageDrawIds.map(drawId => 
        fetchDrawData(seriesIndex, drawId, { 
          ...params,
          forceRefresh: params.forceRefresh 
        })
      );
      
      // Wait for all promises with graceful handling of failures
      const results = await Promise.allSettled(drawPromises);
      
      // Filter successful results
      const drawsData = results
        .filter((result): result is PromiseFulfilledResult<LotteryDraw> => 
          result.status === 'fulfilled' && !!result.value
        )
        .map(result => result.value);
      
      // Update pagination info
      setPagination(prev => ({
        ...prev,
        [`series_draws_${seriesIndex}`]: {
          page,
          pageSize,
          totalItems,
          totalPages
        }
      }));
      
      clearError(loadingKey);
      
      return drawsData;
    } catch (error) {
      console.error(`Error fetching draws for series ${seriesIndex}:`, error);
      handleError(
        loadingKey, 
        `Failed to fetch draws for series #${seriesIndex}`,
        undefined,
        () => fetchSeriesDraws(seriesIndex, params)
      );
      return [];
    } finally {
      setLoadingState(loadingKey, false);
    }
  }, [
    seriesList,
    fetchSeriesInfo,
    fetchDrawData,
    setLoadingState,
    handleError,
    clearError
  ]);
  
  /**
   * Fetch user's tickets across all draws or for specific draw
   */
  const fetchUserTickets = useCallback(async (
    params: FetchParams = DEFAULT_FETCH_PARAMS
  ): Promise<Record<string, LotteryTicket[]>> => {
    if (!walletAddress || !contractInstance) {
      handleError('user_tickets', walletAddress 
        ? 'Contract not initialized' 
        : 'Wallet not connected'
      );
      return {};
    }
    
    const loadingKey = 'user_tickets';
    setLoadingState(loadingKey, true);
    
    try {
      // Initialize results object
      const userTickets: Record<string, LotteryTicket[]> = {};
      
      // If specific draw & series are provided
      if (params.seriesIndex !== undefined && params.drawId !== undefined) {
        const tickets = await fetchUserTicketsForDraw(
          params.seriesIndex,
          params.drawId,
          walletAddress
        );
        
        if (tickets.length > 0) {
          userTickets[`${params.seriesIndex}_${params.drawId}`] = tickets;
        }
        
        clearError(loadingKey);
        return userTickets;
      }
      
      // Otherwise, fetch tickets for all series and draws
      // First, ensure we have the series list
      let allSeries = seriesList;
      if (allSeries.length === 0) {
        allSeries = await fetchAllSeries();
      }
      
      // Process each series
      for (const series of allSeries) {
        // Fetch draws for this series if we don't have them
        if (!series.drawIds.length) {
          await fetchSeriesDraws(series.index);
          continue;
        }
        
        // Check user tickets for each draw
        for (const drawId of series.drawIds) {
          const tickets = await fetchUserTicketsForDraw(
            series.index,
            drawId,
            walletAddress
          );
          
          if (tickets.length > 0) {
            userTickets[`${series.index}_${drawId}`] = tickets;
          }
        }
      }
      
      clearError(loadingKey);
      return userTickets;
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      handleError(
        loadingKey, 
        'Failed to fetch your tickets',
        undefined,
        () => fetchUserTickets(params)
      );
      return {};
    } finally {
      setLoadingState(loadingKey, false);
    }
  }, [
    walletAddress,
    contractInstance,
    seriesList,
    fetchAllSeries,
    fetchSeriesDraws,
    setLoadingState,
    handleError,
    clearError
  ]);
  
  /**
   * Fetch user tickets for a specific draw
   */
  const fetchUserTicketsForDraw = useCallback(async (
    seriesIndex: number,
    drawId: number,
    userAddress: string
  ): Promise<LotteryTicket[]> => {
    if (!contractInstance) return [];
    
    const cacheKey = `user_tickets_${userAddress}_${seriesIndex}_${drawId}`;
    
    try {
      // Check cache first
      const cachedTickets = getFromCache<LotteryTicket[]>(cacheKey);
      if (cachedTickets) return cachedTickets;
      
      // Get user ticket count
      const ticketCount = await contractInstance.getUserTicketsCount(userAddress, drawId);
      
      if (Number(ticketCount) === 0) {
        return [];
      }
      
      // Fetch all tickets
      const tickets: LotteryTicket[] = [];
      
      for (let i = 0; i < Number(ticketCount); i++) {
        try {
          const ticketDetails = await contractInstance.getUserTicketDetails(userAddress, drawId, i);
          
          const ticket: LotteryTicket = {
            ticketId: `${drawId}-${userAddress}-${i}`,
            walletAddress: userAddress,
            numbers: ticketDetails[0].map((num: ethers.BigNumberish) => Number(num)),
            lottoNumber: Number(ticketDetails[1]),
            timestamp: Number(ticketDetails[2]) * 1000,
            drawId,
            seriesIndex
          };
          
          tickets.push(ticket);
        } catch (ticketError) {
          console.warn(`Error fetching ticket ${i} for user ${userAddress} in draw ${drawId}:`, ticketError);
        }
      }
      
      // Cache the results
      saveToCache(cacheKey, tickets);
      
      return tickets;
    } catch (error) {
      console.error(`Error fetching user tickets for draw ${drawId}:`, error);
      return [];
    }
  }, [contractInstance]);
  
  /**
   * Change page for a specific data set
   */
  const changePage = useCallback((
    dataKey: string,
    newPage: number
  ) => {
    // Get current pagination info
    const paginationInfo = pagination[dataKey];
    if (!paginationInfo) return;
    
    // Validate page
    if (newPage < 1 || newPage > paginationInfo.totalPages) return;
    
    // Extract series and draw info from key
    let seriesIndex: number | undefined;
    let drawId: number | undefined;
    
    if (dataKey.startsWith('series_draws_')) {
      seriesIndex = parseInt(dataKey.replace('series_draws_', ''));
      
      // Fetch new page of draws
      fetchSeriesDraws(seriesIndex, {
        page: newPage,
        pageSize: paginationInfo.pageSize
      });
    } else if (dataKey.includes('_')) {
      const [series, draw] = dataKey.split('_').map(Number);
      seriesIndex = series;
      drawId = draw;
      
      // Fetch new page of participants
      fetchDrawParticipants(seriesIndex, drawId, {
        page: newPage,
        pageSize: paginationInfo.pageSize
      });
    }
  }, [pagination, fetchSeriesDraws, fetchDrawParticipants]);
  
  /**
   * Clear all cache and refresh data
   */
  const refreshAllData = useCallback(() => {
    // Clear the cache
    invalidateSeriesCache();
    
    // Reload core data
    fetchAllSeries({ forceRefresh: true });
    
    // Reset selections
    setSelectedSeriesIndex(undefined);
    setSelectedDrawId(undefined);
  }, [fetchAllSeries]);
  
  /**
   * Initialize the hook by loading series list
   */
  useEffect(() => {
    if (contractInstance) {
      fetchAllSeries();
    }
  }, [contractInstance, fetchAllSeries]);
  
  /**
   * Load draws when series is selected
   */
  useEffect(() => {
    if (selectedSeriesIndex !== undefined && contractInstance) {
      fetchSeriesDraws(selectedSeriesIndex);
    }
  }, [selectedSeriesIndex, contractInstance, fetchSeriesDraws]);
  
  /**
   * Load participants when draw is selected
   */
  useEffect(() => {
    if (
      selectedSeriesIndex !== undefined && 
      selectedDrawId !== undefined && 
      contractInstance
    ) {
      fetchDrawParticipants(selectedSeriesIndex, selectedDrawId);
    }
  }, [
    selectedSeriesIndex, 
    selectedDrawId, 
    contractInstance, 
    fetchDrawParticipants
  ]);
  
  // Formatting helpers for cleaner usage
  const formatEthValue = useCallback((value: string) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? '0' : parsed.toFixed(4);
  }, []);
  
  const formatUSD = useCallback((ethValue: string) => {
    const eth = parseFloat(ethValue);
    if (isNaN(eth)) return '$0.00';
    
    // Assume 1 ETH = $2,000 (would be replaced with actual price feed)
    const usd = eth * 2000;
    return `$${usd.toFixed(2)}`;
  }, []);
  
  // Return all the necessary data and functions
  return {
    // Core data
    seriesList,
    draws,
    participants,
    selectedSeriesIndex,
    selectedDrawId,
    pagination,
    isLoading,
    errors,
    
    // Setters
    setSelectedSeriesIndex,
    setSelectedDrawId,
    
    // Helper functions
    formatEthValue,
    formatUSD,
    
    // Fetch functions
    fetchAllSeries,
    fetchSeriesDraws,
    fetchDrawData,
    fetchDrawParticipants,
    fetchUserTickets,
    
    // Pagination
    changePage,
    
    // Utilities
    refreshAllData,
    clearError
  };
}

// Export a singleton instance for global state sharing
export default useScalableLotteryData;