import React, { useState, useEffect } from 'react';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useDrawDate } from '@/hooks/useDrawDate';
import { formatAddress } from '@/lib/web3';
import { ExternalLink, History as HistoryIcon, Award, Info as InfoIcon, Target, Filter, Calendar, Database } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LotterySeries, LotteryDraw } from '@/lib/lotteryContract';
import { getLotteryAddress } from '@shared/contracts';
import { Skeleton } from '@/components/ui/skeleton';
import { useWallet } from '@/hooks/useWallet';
import { ethers } from 'ethers';
import { lotteryABI } from '@shared/lotteryABI';

// Define a proper type for the round data
interface RoundData {
  id: number;
  roundNumber: number;
  endTime: Date;
  poolAmount: string;
  participantCount: number;
  winnerAddress: string;
  transactionHash: string;
  winningTicketIndex?: number;
  winningNumbers?: number[];
  prizeAmount: string;
  seriesIndex: number; // Making this required
  drawId: number; // Making this required
}

// Custom hook to fetch additional draw data from the contract
function useContractDrawData() {
  const { provider } = useWallet();
  const [drawData, setDrawData] = useState<RoundData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Fetch data for a specific draw from the contract
  const fetchDrawData = async (drawId: number, seriesIndex: number) => {
    if (!provider) {
      console.warn("Provider not available, cannot fetch contract data");
      return null;
    }
    
    setIsLoading(true);
    try {
      const lotteryAddress = getLotteryAddress();
      console.log("Creating contract with address:", lotteryAddress);
      
      // Log provider info
      console.log("Provider type:", typeof provider);
      
      const contract = new ethers.Contract(lotteryAddress, lotteryABI, provider);
      
      // Get winner data for the draw
      const winner = await contract.getWinner(drawId);
      const winnerAddress = winner[0];
      
      // Get prize amount 
      const jackpot = await contract.getJackpot(drawId);
      const prizeAmount = ethers.formatEther(jackpot);
      
      // Get ticket count
      const ticketCount = await contract.getTotalTicketsSold(drawId);
      const participantCount = Number(ticketCount);
      
      // Get winning numbers
      const winningNumbers = await contract.getWinningNumbers(drawId);
      const numbers = winningNumbers.map((num: any) => Number(num));
      
      // Get end time - this needs to be estimated based on draw creation
      const endTime = new Date();
      endTime.setDate(endTime.getDate() - 7); // Approximate 1 week ago
      
      // Construct the round data with guaranteed non-undefined values
      const round: RoundData = {
        id: 100 + drawId, // Use a different id range to avoid conflicts with API data
        roundNumber: drawId,
        endTime: endTime,
        poolAmount: prizeAmount,
        participantCount: participantCount,
        winnerAddress: winnerAddress || "0x0000000000000000000000000000000000000000",
        prizeAmount: prizeAmount,
        transactionHash: "0x" + "0".repeat(64), // Placeholder transaction hash
        seriesIndex: seriesIndex,
        drawId: drawId,
        winningNumbers: numbers
      };
      
      setDrawData(prev => {
        // Don't add duplicates
        const exists = prev.some(r => 
          r.drawId === drawId && 
          r.seriesIndex === seriesIndex
        );
        if (exists) return prev;
        return [...prev, round];
      });
      
      return round;
    } catch (error) {
      console.error(`Error fetching draw ${drawId} for series ${seriesIndex}:`, error);
      // Log more details about what might have caused the error
      console.log("Provider state:", provider ? "Connected" : "Not connected");
      console.log("Contract address used:", getLotteryAddress());
      console.log("Draw ID:", drawId, "Series Index:", seriesIndex);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { drawData, isLoading, fetchDrawData };
}

export default function History() {
  const { 
    pastWinners, 
    isLoadingPastWinners, 
    formatUSD,
    seriesList,
    isLoadingSeriesList,
    seriesDraws,
    isLoadingSeriesDraws,
    selectedSeriesIndex,
    selectedDrawId,
    setSelectedSeriesIndex,
    setSelectedDrawId,
    refreshSeriesData,
    refetchSeriesDraws
  } = useLotteryData();
  
  const { settings } = useAppSettings();
  const { getDrawDate } = useDrawDate();
  
  // Use the contract draw data hook
  const { drawData, isLoading: isLoadingDrawData, fetchDrawData } = useContractDrawData();
  
  // No hardcoded data - all data must come from the blockchain
  const [hardcodedData, setHardcodedData] = useState<RoundData[]>([]);
  
  // Local state to store filtered winners by series and draw
  const [filteredRounds, setFilteredRounds] = useState<RoundData[]>([]);
  
  // Format the date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };
  
  // Process and filter winners based on selected series and draw
  useEffect(() => {
    console.log("Past winners data:", pastWinners);
    console.log("Contract draw data:", drawData);
    console.log("Hardcoded data:", hardcodedData);
    
    // No special cases for specific series/draws - all data must come from blockchain
    
    if (!pastWinners || (Array.isArray(pastWinners) && pastWinners.length === 0)) {
      if (drawData.length === 0 && hardcodedData.length === 0) {
        console.log("No past winners data available from API or contract");
        setFilteredRounds([]);
        return;
      }
    }
  
    // Base data - all rounds from pastWinners
    const apiRounds: RoundData[] = pastWinners as RoundData[] || [];
    console.log("API rounds data:", apiRounds);
    
    // IMPORTANT: Add missing seriesIndex and drawId properties for compatibility
    // The API returns data without these properties, so we need to add them
    const processedApiRounds = apiRounds.map(round => {
      // For historical reasons, we assume series 0 if not specified
      return {
        ...round,
        seriesIndex: round.seriesIndex !== undefined ? round.seriesIndex : 0,
        drawId: round.drawId !== undefined ? round.drawId : round.roundNumber
      };
    });
    
    // Combine API data with contract data and our hardcoded data
    // giving preference to contract data for matching series/draw
    const allRounds = [...processedApiRounds, ...hardcodedData];
    
    // Add contract data if not already present in API data
    drawData.forEach(contractRound => {
      const exists = allRounds.some(round => 
        round.seriesIndex === contractRound.seriesIndex && 
        round.drawId === contractRound.drawId
      );
      
      if (!exists) {
        console.log(`Adding contract data for series ${contractRound.seriesIndex}, draw ${contractRound.drawId}`);
        allRounds.push(contractRound);
      }
    });
    
    console.log("Combined rounds with added properties:", allRounds);
    
    if (selectedSeriesIndex !== undefined && selectedDrawId !== undefined) {
      // Filter by both series and draw
      console.log(`Filtering by series: ${selectedSeriesIndex} and draw: ${selectedDrawId}`);
      const filtered = allRounds.filter(round => {
        const matchesSeries = round.seriesIndex === selectedSeriesIndex;
        const matchesDraw = round.drawId === selectedDrawId || round.roundNumber === selectedDrawId;
        console.log(`Round ${round.id} - seriesIndex: ${round.seriesIndex}, drawId: ${round.drawId}, roundNumber: ${round.roundNumber}`);
        console.log(`Matches series: ${matchesSeries}, matches draw: ${matchesDraw}`);
        return matchesSeries && matchesDraw;
      });
      console.log("Filtered rounds (series+draw):", filtered);
      setFilteredRounds(filtered.length > 0 ? filtered : []);
    } else if (selectedSeriesIndex !== undefined) {
      // Filter by series only
      console.log(`Filtering by series: ${selectedSeriesIndex}`);
      const filtered = allRounds.filter(round => {
        console.log(`Round ${round.id} - series: ${round.seriesIndex}`);
        return round.seriesIndex === selectedSeriesIndex;
      });
      console.log("Filtered rounds (series only):", filtered);
      setFilteredRounds(filtered.length > 0 ? filtered : []);
    } else {
      // No filters, show all rounds
      console.log('Showing all rounds, count:', allRounds.length);
      setFilteredRounds(allRounds);
    }
  }, [pastWinners, selectedSeriesIndex, selectedDrawId, drawData]);
  
  // Helper function to process raw data with missing properties
  const processRawData = (rounds: any[]): RoundData[] => {
    return rounds.map(round => {
      // Ensure non-undefined values for type safety
      const processedRound: RoundData = {
        // Required properties with proper defaults
        id: round.id || 0,
        roundNumber: round.roundNumber || 0,
        endTime: round.endTime || new Date(),
        poolAmount: round.poolAmount || "0",
        participantCount: round.participantCount || 0,
        winnerAddress: round.winnerAddress || "0x0000000000000000000000000000000000000000",
        transactionHash: round.transactionHash || "0x" + "0".repeat(64),
        prizeAmount: round.prizeAmount || "0",
        // These are required now
        seriesIndex: round.seriesIndex !== undefined ? round.seriesIndex : 0,
        drawId: round.drawId !== undefined ? round.drawId : round.roundNumber || 0,
        // Optional properties
        winningTicketIndex: round.winningTicketIndex,
        winningNumbers: round.winningNumbers
      };
      return processedRound;
    });
  };

  // Handler for series selection
  const handleSeriesChange = (value: string) => {
    if (value === 'all') {
      console.log('Selected All Series');
      setSelectedSeriesIndex(undefined);
      // Reset draw selection when choosing "All Series"
      setSelectedDrawId(undefined);
      
      // Show all rounds when All Series is selected
      const apiRounds = pastWinners as RoundData[] || [];
      
      // Combine API and contract data only
      const allRounds = [...processRawData(apiRounds), ...drawData];
      console.log('Showing all rounds after clearing series filter:', allRounds);
      setFilteredRounds(allRounds);
    } else {
      const seriesIndex = parseInt(value);
      if (!isNaN(seriesIndex)) {
        console.log(`Selected Series #${seriesIndex}`);
        
        // Set the selected series index
        // This will automatically reset the draw selection
        setSelectedSeriesIndex(seriesIndex);
        
        // Log status before filtering
        console.log(`Checking for draws in series #${seriesIndex}...`);
        
        // Get data from the API and contract
        const apiRounds = pastWinners as RoundData[] || [];
        const combinedRounds = [...processRawData(apiRounds), ...drawData];
        
        // Filter rounds by series
        const filtered = combinedRounds.filter(round => round.seriesIndex === seriesIndex);
        console.log(`Filtered by series #${seriesIndex}:`, filtered);
        setFilteredRounds(filtered.length > 0 ? filtered : []);
      }
    }
  };
  
  // Handler for draw selection
  const handleDrawChange = (value: string) => {
    if (value === 'all') {
      console.log('Selected All Draws');
      setSelectedDrawId(undefined);
      
      // When "All Draws" is selected, filter only by series if one is selected
      if (selectedSeriesIndex !== undefined) {
        // Get data from API and contract
        const apiRounds = pastWinners as RoundData[] || [];
        const combinedRounds = [...processRawData(apiRounds), ...drawData];
        
        // Filter by series only
        const filtered = combinedRounds.filter(round => round.seriesIndex === selectedSeriesIndex);
        console.log(`Filtering by series #${selectedSeriesIndex} after clearing draw filter:`, filtered);
        setFilteredRounds(filtered.length > 0 ? filtered : []);
      } else {
        // Show all rounds when no series is selected
        const apiRounds = pastWinners as RoundData[] || [];
        const combinedRounds = [...processRawData(apiRounds), ...drawData];
        console.log('Showing all rounds after clearing all filters:', combinedRounds);
        setFilteredRounds(combinedRounds);
      }
    } else {
      const drawId = parseInt(value);
      if (!isNaN(drawId)) {
        console.log(`Selected Draw #${drawId}`);
        setSelectedDrawId(drawId);
        
        // Filter by both series and draw if a series is selected
        if (selectedSeriesIndex !== undefined) {
          // Get data from API and contract
          const apiRounds = pastWinners as RoundData[] || [];
          const combinedRounds = [...processRawData(apiRounds), ...drawData];
          
          // Filter by both series and draw
          const filtered = combinedRounds.filter(round => {
            const matchesSeries = round.seriesIndex === selectedSeriesIndex;
            const matchesDraw = round.drawId === drawId || round.roundNumber === drawId;
            return matchesSeries && matchesDraw;
          });
          console.log(`Filtered by series #${selectedSeriesIndex} and draw #${drawId}:`, filtered);
          setFilteredRounds(filtered.length > 0 ? filtered : []);
        }
      }
    }
  };
  
  // Early return if no data is available
  if (filteredRounds.length === 0 && !isLoadingPastWinners) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <HistoryIcon className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-amber-500 text-transparent bg-clip-text">Lottery History</h1>
          </div>
          <button
            onClick={() => {
              console.log('Manually refreshing series and draw data...');
              refreshSeriesData(selectedSeriesIndex)
                .then(() => {
                  console.log('Data refreshed successfully');
                  // Force a refetch of the series draws
                  refetchSeriesDraws();
                })
                .catch((error: unknown) => {
                  console.error('Error refreshing data:', error);
                });
            }}
            className="text-primary hover:text-white text-sm flex items-center bg-black/40 border border-primary/30 py-1 px-3 rounded-md"
          >
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 3V8H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 16V21H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.86C14.7781 3.29759 13.4354 3.00157 12.075 3C7.075 3 3.075 7 3.075 12C3.075 13.5 3.475 14.9 4.175 16.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 20.14C9.22194 20.7024 10.5646 20.9984 11.925 21C16.925 21 20.925 17 20.925 12C20.925 10.5 20.525 9.1 19.825 7.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Refresh Data
          </button>
        </div>
        
        {/* Series and Draw Selection */}
        <div className="casino-card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-primary text-sm font-medium mb-2 block">Series</label>
              {isLoadingSeriesList ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedSeriesIndex !== undefined ? selectedSeriesIndex.toString() : undefined}
                  onValueChange={handleSeriesChange}
                >
                  <SelectTrigger className="bg-black/40 border-primary/30">
                    <SelectValue placeholder="Select a series" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-primary/30">
                    <SelectItem value="all">All Series</SelectItem>
                    {seriesList && seriesList.length > 0 ? (
                      seriesList.map((series: LotterySeries) => (
                        <SelectItem key={series.index} value={series.index.toString()}>
                          {series.name} (Series #{series.index})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem disabled value="no-series">No Series Available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div>
              <label className="text-primary text-sm font-medium mb-2 block">Draw</label>
              {isLoadingSeriesDraws ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedDrawId !== undefined ? selectedDrawId.toString() : undefined}
                  onValueChange={handleDrawChange}
                  disabled={selectedSeriesIndex === undefined} // Only disable when "All Series" is selected (undefined)
                >
                  <SelectTrigger className="bg-black/40 border-primary/30">
                    <SelectValue placeholder="Select a draw" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-primary/30">
                    <SelectItem value="all">All Draws</SelectItem>
                    {selectedSeriesIndex !== undefined && seriesDraws && seriesDraws.length > 0 ? (
                      seriesDraws.map((draw: LotteryDraw) => (
                        <SelectItem key={draw.drawId} value={draw.drawId.toString()}>
                          Draw #{draw.drawId}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem disabled value="no-draws">No Draws Available</SelectItem>
                    )}
                    
                    {/* Log series draws data for debugging */}
                    {(() => {
                      console.log("Rendering draw dropdown with seriesDraws:", {
                        selectedSeriesIndex,
                        seriesDraws: seriesDraws || [],
                        hasDraws: seriesDraws && seriesDraws.length > 0
                      });
                      return null;
                    })()}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          
          {/* Filter active message */}
          {(selectedSeriesIndex !== undefined || selectedDrawId !== undefined) && (
            <div className="mt-4 flex items-center text-xs text-primary space-x-2">
              <Filter className="h-3 w-3" />
              <span>
                Filtering: 
                {selectedSeriesIndex !== undefined && ` Series #${selectedSeriesIndex}`}
                {selectedSeriesIndex !== undefined && selectedDrawId !== undefined && ' -'}
                {selectedDrawId !== undefined && ` Draw #${selectedDrawId}`}
              </span>
            </div>
          )}
        </div>
        
        <div className="casino-card p-12 text-center">
          <div className="rounded-full mx-auto h-16 w-16 bg-black/30 border border-primary/30 flex items-center justify-center mb-4">
            <InfoIcon className="h-8 w-8 text-primary/70" />
          </div>
          <h3 className="text-xl font-medium text-primary">No Historical Data Available</h3>
          <p className="text-white/80 mt-2">
            No past lottery rounds or winners have been found for the selected filters.
          </p>
          
          {(selectedSeriesIndex !== undefined || selectedDrawId !== undefined) && (
            <button
              onClick={() => {
                console.log('Clearing all filters');
                setSelectedSeriesIndex(undefined);
                setSelectedDrawId(undefined);
                
                // Reset to show all rounds - include both API and contract data
                const apiRounds = pastWinners as RoundData[] || [];
                const allRounds = [...processRawData(apiRounds), ...drawData];
                console.log('Showing all rounds after clearing all filters:', allRounds);
                setFilteredRounds(allRounds);
              }}
              className="mt-4 text-primary hover:text-white underline text-sm flex items-center mx-auto"
            >
              <Filter className="h-3 w-3 mr-1" /> Clear filters
            </button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <HistoryIcon className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-amber-500 text-transparent bg-clip-text">Lottery History</h1>
        </div>
        <button
          onClick={() => {
            console.log('Manually refreshing series and draw data...');
            refreshSeriesData(selectedSeriesIndex)
              .then(() => {
                console.log('Data refreshed successfully');
                // Force a refetch of the series draws
                refetchSeriesDraws();
              })
              .catch((error: unknown) => {
                console.error('Error refreshing data:', error);
              });
          }}
          className="text-primary hover:text-white text-sm flex items-center bg-black/40 border border-primary/30 py-1 px-3 rounded-md"
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 3V8H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 16V21H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 3.86C14.7781 3.29759 13.4354 3.00157 12.075 3C7.075 3 3.075 7 3.075 12C3.075 13.5 3.475 14.9 4.175 16.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 20.14C9.22194 20.7024 10.5646 20.9984 11.925 21C16.925 21 20.925 17 20.925 12C20.925 10.5 20.525 9.1 19.825 7.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Refresh Data
        </button>
      </div>
      
      {/* Series and Draw Selection */}
      <div className="casino-card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settings.showSeriesDropdown && (
            <div>
              <label className="text-primary text-sm font-medium mb-2 block">Series</label>
              {isLoadingSeriesList ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedSeriesIndex !== undefined ? selectedSeriesIndex.toString() : undefined}
                  onValueChange={handleSeriesChange}
                >
                  <SelectTrigger className="bg-black/40 border-primary/30">
                    <SelectValue placeholder="Select a series" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-primary/30">
                    <SelectItem value="all">All Series</SelectItem>
                    {seriesList && seriesList.length > 0 ? (
                      seriesList.map((series: LotterySeries) => (
                        <SelectItem key={series.index} value={series.index.toString()}>
                          {series.name} (Series #{series.index})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem disabled value="no-series">No Series Available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          
          <div className={settings.showSeriesDropdown ? "" : "md:col-span-2"}>
            <label className="text-primary text-sm font-medium mb-2 block">
              {settings.showSeriesDropdown ? "Draw" : "Current Draw"}
            </label>
            {isLoadingSeriesDraws ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedDrawId !== undefined ? selectedDrawId.toString() : undefined}
                onValueChange={handleDrawChange}
                disabled={settings.showSeriesDropdown && selectedSeriesIndex === undefined} // Only disable when "All Series" is selected in series mode
              >
                <SelectTrigger className="bg-black/40 border-primary/30">
                  {!settings.showSeriesDropdown && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-primary/70" />
                      <SelectValue placeholder="Select a draw" />
                    </div>
                  )}
                  {settings.showSeriesDropdown && (
                    <SelectValue placeholder="Select a draw" />
                  )}
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-primary/30">
                  <SelectItem value="all">All Draws</SelectItem>
                  {selectedSeriesIndex !== undefined && seriesDraws && seriesDraws.length > 0 ? (
                    seriesDraws.map((draw: LotteryDraw) => (
                      <SelectItem key={draw.drawId} value={draw.drawId.toString()}>
                        Draw #{draw.drawId}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem disabled value="no-data">No draws available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        {/* Filter active message */}
        {(selectedSeriesIndex !== undefined || selectedDrawId !== undefined) && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center text-xs text-primary space-x-2">
              <Filter className="h-3 w-3" />
              <span>
                Filtering: 
                {selectedSeriesIndex !== undefined && ` Series #${selectedSeriesIndex}`}
                {selectedSeriesIndex !== undefined && selectedDrawId !== undefined && ' -'}
                {selectedDrawId !== undefined && ` Draw #${selectedDrawId}`}
              </span>
            </div>
            <button
              onClick={() => {
                console.log('Clearing all filters');
                setSelectedSeriesIndex(undefined);
                setSelectedDrawId(undefined);
                
                // Reset to show all rounds - include both API and contract data
                const apiRounds = pastWinners as RoundData[] || [];
                const allRounds = [...processRawData(apiRounds), ...drawData];
                console.log('Showing all rounds after clearing all filters:', allRounds);
                setFilteredRounds(allRounds);
              }}
              className="text-primary hover:text-white text-xs underline flex items-center"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      
      <Tabs defaultValue="rounds" className="casino-card p-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6 bg-black/40 border-primary/30">
          <TabsTrigger value="rounds" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none">Past Rounds</TabsTrigger>
          <TabsTrigger value="winners" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none">Winners</TabsTrigger>
        </TabsList>
        
        {isLoadingPastWinners ? (
          <div className="py-12 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-opacity-30 border-t-primary rounded-full mb-4"></div>
            <p className="text-white/80">Loading lottery history...</p>
          </div>
        ) : (
          <>
            <TabsContent value="rounds">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-black/40">
                      <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Round</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Series</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Pool Size</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Participants</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Winner</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">TX</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/10">
                    {filteredRounds.length > 0 ? (
                      filteredRounds.map((round) => (
                        <tr key={round.id} className="bg-black/20 hover:bg-black/30">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-sm font-semibold text-white">#{round.roundNumber}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {round.seriesIndex !== undefined ? (
                              <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                                Series #{round.seriesIndex}
                              </Badge>
                            ) : (
                              <span className="text-white/60">Default</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                            {formatDate(round.endTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-white">
                            {round.poolAmount} ETH
                            <div className="text-xs text-primary/80">
                              ≈ {formatUSD(round.poolAmount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {round.participantCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                            <a 
                              href={`https://sepolia.etherscan.io/address/${round.winnerAddress}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:text-white transition flex items-center"
                            >
                              {formatAddress(round.winnerAddress)}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <a 
                              href={`https://testnet.bscscan.com/tx/${round.transactionHash}`}
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-primary/60 hover:text-primary transition"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-white/60">
                          <Database className="h-12 w-12 mx-auto mb-4 text-primary/30" />
                          <p className="text-lg mb-1">No Lottery History Available</p>
                          <p className="text-sm">No past draws have been conducted on the blockchain.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="winners">
              {filteredRounds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredRounds.map((round) => (
                    <div key={`winner-${round.id}`} className="casino-card pt-12 mt-6">
                      <div className="casino-card-header flex justify-between items-center absolute inset-x-0 top-0 px-6 py-4 bg-black/40 border-b border-primary/20 rounded-t-xl">
                        <div className="text-sm uppercase tracking-widest font-bold text-primary flex items-center">
                          <Award className="h-4 w-4 mr-2" />
                          {round.seriesIndex !== undefined && (
                            <span className="mr-1">S{round.seriesIndex}</span>
                          )}
                          Round #{round.roundNumber}
                        </div>
                        <span className="text-sm font-mono text-white/70">{formatDate(round.endTime)}</span>
                      </div>
                      <div className="p-4 pt-6">
                        {/* Winner */}
                        <div className="mb-4">
                          <div className="text-sm text-primary/80 uppercase tracking-wider font-medium mb-2">Winner</div>
                          <div className="font-mono text-sm truncate">
                            <a 
                              href={`https://sepolia.etherscan.io/address/${round.winnerAddress}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-white hover:text-primary transition"
                            >
                              {formatAddress(round.winnerAddress)}
                            </a>
                          </div>
                          <div className="text-xs text-white/60 mt-1">
                            Winning Ticket #<span className="lotto-number">{round.winningTicketIndex !== undefined ? round.winningTicketIndex : "N/A"}</span>
                          </div>
                        </div>
                        
                        {/* Winning Numbers */}
                        {round.winningNumbers && (
                          <div className="mb-4">
                            <div className="text-sm text-primary/80 uppercase tracking-wider font-medium mb-2 flex items-center">
                              <Target size={14} className="mr-2" /> Winning Numbers
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {round.winningNumbers.slice(0, 5).map((num, idx) => (
                                <Badge key={idx} variant="outline" className="lotto-number bg-primary/10 border-primary/30 text-primary rounded-full">
                                  {num.toString().padStart(2, '0')}
                                </Badge>
                              ))}
                              {round.winningNumbers[5] && (
                                <Badge key="lotto" variant="default" className="lotto-number bg-accent/10 text-accent border-accent/30 rounded-full">
                                  {round.winningNumbers[5].toString().padStart(2, '0')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Prize Amount */}
                        <div className="mb-4">
                          <div className="text-sm text-primary/80 uppercase tracking-wider font-medium mb-2">Prize Amount</div>
                          <div className="crypto-value text-lg text-white">{round.prizeAmount} ETH</div>
                          <div className="text-sm text-primary/70">≈ {formatUSD(round.prizeAmount)}</div>
                        </div>
                        
                        {/* Footer */}
                        <div className="flex justify-between text-sm mt-6 pt-4 border-t border-primary/10">
                          <div>
                            <span className="text-white/60">Tickets Sold:</span>
                            <span className="lotto-number ml-1 text-white">{round.participantCount}</span>
                          </div>
                          <a 
                            href={`https://testnet.bscscan.com/tx/${round.transactionHash}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary/80 hover:text-primary transition flex items-center"
                          >
                            Explorer <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Award className="h-16 w-16 mx-auto mb-4 text-primary/30" />
                  <h3 className="text-xl font-bold text-white mb-2">No Winners Yet</h3>
                  <p className="text-white/60 max-w-md mx-auto">
                    No completed lottery draws have been found on the blockchain. 
                    Winners will appear here once draws are completed.
                  </p>
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
