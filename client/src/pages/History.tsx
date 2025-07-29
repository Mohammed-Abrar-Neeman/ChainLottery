import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, History as HistoryIcon, Filter, Database } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useLotteryContract } from '@/hooks/useLotteryContract';
import { useAppKitAccount } from '@reown/appkit/react';
import { Skeleton } from "@/components/ui/skeleton";

interface Winner {
  winnerAddress: string;
  ticketIndex: number;
  amountWon: string;
}

interface ContractWinner {
  winnerAddress: string;
  ticketIndex: bigint;
  amountWon: bigint;
}

interface LotteryHistoryEntry {
  seriesIndex: number;
  drawId: number;
  endTime: Date;
  jackpotAmount: string;
  participantCount: number;
  winningNumbers?: number[];
  winners?: Winner[];
  transactionHash?: string;
}

// Static data for testing UI
const MOCK_HISTORY = [
  {
    seriesIndex: 0,
    drawId: 1,
    endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    jackpotAmount: "1000000000000000000", // 1 POL
    participantCount: 150,
    winningNumbers: [1, 2, 3, 4, 5, 6],
    winnerAddress: "0x1234567890123456789012345678901234567890",
    transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
  },
  {
    seriesIndex: 0,
    drawId: 2,
    endTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    jackpotAmount: "2000000000000000000", // 2 POL
    participantCount: 200,
    winningNumbers: [7, 8, 9, 10, 11, 12],
    winnerAddress: "0x0987654321098765432109876543210987654321",
    transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  }
];

export default function History() {
  const { address, isConnected } = useAppKitAccount();
  const { getSeriesList, getSeriesDraws, getLotteryData, getContract } = useLotteryContract();
  const [seriesList, setSeriesList] = useState<{ index: number; name: string; active: boolean; }[]>([]);
  const [seriesDraws, setSeriesDraws] = useState<{ drawId: number; seriesIndex: number; completed: boolean; }[]>([]);
  const [historyData, setHistoryData] = useState<LotteryHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeriesIndex, setSelectedSeriesIndex] = useState<number | undefined>();
  const [selectedDrawId, setSelectedDrawId] = useState<number | undefined>();

  // Format date to "May 28, 2025, 5:34 PM"
  const formatDate = (date: Date) => {
    return format(date, 'MMMM d, yyyy, h:mm a');
  };

  // Fetch series list on mount
  useEffect(() => {
    const fetchSeries = async () => {
      if (!isConnected) return;
      
      setIsLoading(true);
      try {
        const series = await getSeriesList();
        setSeriesList(series.map(s => ({
          index: s.index,
          name: s.name || `Series ${s.index}`,
          active: true // We'll get this from contract later
        })));
    } catch (error) {
        console.error('Error fetching series:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
    fetchSeries();
  }, [isConnected, getSeriesList]);

  // Fetch draws when series is selected
  useEffect(() => {
    const fetchDraws = async () => {
      if (!isConnected || selectedSeriesIndex === undefined) return;
      
      setIsLoading(true);
      try {
        const draws = await getSeriesDraws(selectedSeriesIndex);
        setSeriesDraws(draws.map(d => ({
          drawId: d.drawId,
          seriesIndex: d.seriesIndex,
          completed: d.completed
        })));
      } catch (error) {
        console.error('Error fetching draws:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDraws();
  }, [isConnected, selectedSeriesIndex, getSeriesDraws]);

  // Fetch lottery data when series is selected
  useEffect(() => {
    const fetchAllDrawsData = async () => {
      if (!isConnected || selectedSeriesIndex === undefined) return;
      
      setIsLoading(true);
      try {
        const allHistoryData: LotteryHistoryEntry[] = [];
        
        // Fetch data for each draw in the series
        for (const draw of seriesDraws) {
          const data = await getLotteryData(selectedSeriesIndex, draw.drawId);
          if (data) {
            // Check if we have winning numbers
            const hasWinningNumbers = data.winningTicketNumbers && 
              data.winningTicketNumbers.some(num => num !== 0);

            // If we have winning numbers, fetch winners
            let winners: Winner[] = [];
            if (hasWinningNumbers) {
              try {
                const contract = await getContract();
                if (contract) {
                  const winnersData = await contract.getWinners(draw.drawId) as ContractWinner[];
                  winners = winnersData.map(w => ({
                    winnerAddress: w.winnerAddress,
                    ticketIndex: Number(w.ticketIndex),
                    amountWon: w.amountWon.toString()
                  }));
                }
              } catch (error) {
                console.error('Error fetching winners:', error);
              }
            }

            const historyEntry: LotteryHistoryEntry = {
              seriesIndex: selectedSeriesIndex,
              drawId: draw.drawId,
              endTime: new Date(data.endTimestamp * 1000),
              jackpotAmount: data.jackpotAmount || "0",
              participantCount: data.participantCount,
              winningNumbers: data.winningTicketNumbers,
              winners: winners,
            };
            allHistoryData.push(historyEntry);
          }
        }

        // Sort history data by draw ID in descending order (newest first)
        allHistoryData.sort((a, b) => b.drawId - a.drawId);
        setHistoryData(allHistoryData);
      } catch (error) {
        console.error('Error fetching lottery data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllDrawsData();
  }, [isConnected, selectedSeriesIndex, seriesDraws, getLotteryData, getContract]);

  // Handle series selection
  const handleSeriesChange = (value: string) => {
    const index = parseInt(value);
    setSelectedSeriesIndex(index);
    setSelectedDrawId(undefined); // Reset draw selection
  };

  // Format POL amount with 4 decimal places
  const formatEthAmount = (amount: string | number) => {
    try {
      console.log('Formatting amount:', amount); // Debug log
      // Amount is already in POL, just format it
      const ethAmount = Number(amount);
      console.log('POL amount:', ethAmount); // Debug log
      // Use toFixed(5) to show more precision and avoid rounding
      return ethAmount.toFixed(5);
    } catch (error) {
      console.error('Error formatting POL amount:', error);
      return "0.00000";
    }
  };

  // Get USD value (placeholder - replace with actual price feed)
  const getUsdValue = (ethAmount: string | number) => {
    try {
      const ethPrice = 2000; // Placeholder price
      const ethValue = Number(ethAmount);
      // Use toFixed(2) for USD to show cents
      return (ethValue * ethPrice).toFixed(2);
    } catch (error) {
      console.error('Error calculating USD value:', error);
      return "0.00";
    }
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get blockchain explorer URL
  const getExplorerUrl = (hash: string) => {
    return `https://basescan.org/tx/${hash}`;
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <HistoryIcon className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-amber-500 text-transparent bg-clip-text">Lottery History</h1>
        </div>
      </div>
      
      {/* Series Selection */}
      <div className="casino-card p-6 mb-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-primary text-sm font-medium mb-2 block">Series</label>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : seriesList.length === 0 ? (
              <div className="text-sm text-white/60">No series available</div>
            ) : (
              <Select
                value={selectedSeriesIndex?.toString()}
                onValueChange={handleSeriesChange}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-black/40 border-primary/30">
                  <SelectValue placeholder="Select a series" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-primary/30">
                  {seriesList.map((series) => (
                    <SelectItem key={series.index} value={series.index.toString()}>
                      {series.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        {/* Filter active message */}
        {selectedSeriesIndex !== undefined && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center text-xs text-primary space-x-2">
              <Filter className="h-3 w-3" />
              <span>
                Showing all draws for Series #{selectedSeriesIndex}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedSeriesIndex(undefined);
                setHistoryData([]);
              }}
              className="text-primary hover:text-white text-xs underline flex items-center"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>
      
      {/* History Table */}
      <div className="casino-card p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-black/40">
                      <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Draw #</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Series</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">End Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Prize Pool</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Participants</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Winning Numbers</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Winner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/10">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Skeleton className="h-4 w-4" />
                            <span className="text-white/60">Loading draw data...</span>
                          </div>
                        </td>
                      </tr>
                    ) : historyData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Database className="h-8 w-8 text-primary/40" />
                            <span className="text-white/60">
                              No data available for this series
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      historyData.map((entry) => (
                        <tr key={`${entry.seriesIndex}-${entry.drawId}`} className="bg-black/20 hover:bg-black/30">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-sm font-semibold text-white">#{entry.drawId}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                              {seriesList.find(s => s.index === entry.seriesIndex)?.name || `Series ${entry.seriesIndex}`}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                            {formatDate(entry.endTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-white">
                            {formatEthAmount(entry.jackpotAmount)} POL
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {entry.participantCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {entry.winningNumbers ? (
                              <div className="flex flex-wrap gap-1">
                                {entry.winningNumbers.slice(0, 5).map((num, idx) => (
                                  <Badge key={idx} variant="outline" className="lotto-number bg-primary/10 border-primary/30 text-primary rounded-full">
                                    {num.toString().padStart(2, '0')}
                                  </Badge>
                                ))}
                                {entry.winningNumbers[5] && (
                                  <Badge key="lotto" variant="default" className="lotto-number bg-accent/10 text-accent border-accent/30 rounded-full">
                                    {entry.winningNumbers[5].toString().padStart(2, '0')}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-white/60">No Winner Announced Yet</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                            {entry.winners && entry.winners.length > 0 ? (
                              <div className="space-y-1">
                                {entry.winners.map((winner, idx) => (
                                  <a 
                                    key={idx}
                                    href={`https://basescan.org/address/${winner.winnerAddress}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-white transition flex items-center"
                                  >
                                    {formatAddress(winner.winnerAddress)}
                                  </a>
                                ))}
                              </div>
                            ) : entry.winningNumbers && entry.winningNumbers.some(num => num !== 0) ? (
                              <span className="text-white/60">No winners found</span>
                            ) : (
                              <span className="text-white/60">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
                </div>
    </div>
  );
}
