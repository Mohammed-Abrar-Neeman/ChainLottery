import React, { useState, useEffect } from 'react';
import { useLotteryHistory, LotteryHistoryData } from '@/hooks/useLotteryHistory';
import { useLotterySeries } from '@/hooks/useLotterySeries';
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
import { Skeleton } from '@/components/ui/skeleton';

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

export default function History() {
  const { 
    history,
    isLoading: isLoadingHistory,
    error: historyError,
    fetchDrawHistory,
    clearHistory
  } = useLotteryHistory();

  const {
    seriesList,
    seriesDraws,
    isLoading: isLoadingSeries,
    error: seriesError,
    fetchSeriesList,
    fetchSeriesDraws
  } = useLotterySeries();

  const [selectedSeriesIndex, setSelectedSeriesIndex] = useState<number | undefined>();
  const [selectedDrawId, setSelectedDrawId] = useState<number | undefined>();

  // Load series list on mount
  useEffect(() => {
    fetchSeriesList();
  }, [fetchSeriesList]);

  // Load series draws when series is selected
  useEffect(() => {
    if (selectedSeriesIndex !== undefined) {
      fetchSeriesDraws(selectedSeriesIndex);
    }
  }, [selectedSeriesIndex, fetchSeriesDraws]);

  // Load draw history when draw is selected
  useEffect(() => {
    if (selectedSeriesIndex !== undefined && selectedDrawId !== undefined) {
      fetchDrawHistory(selectedSeriesIndex, selectedDrawId);
    }
  }, [selectedSeriesIndex, selectedDrawId, fetchDrawHistory]);

  // Format the date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Handler for series selection
  const handleSeriesChange = (value: string) => {
    if (value === 'all') {
      setSelectedSeriesIndex(undefined);
      setSelectedDrawId(undefined);
      clearHistory();
    } else {
      const seriesIndex = parseInt(value);
      if (!isNaN(seriesIndex)) {
        setSelectedSeriesIndex(seriesIndex);
        setSelectedDrawId(undefined);
        clearHistory();
      }
    }
  };

  // Handler for draw selection
  const handleDrawChange = (value: string) => {
    if (value === 'all') {
      setSelectedDrawId(undefined);
      clearHistory();
    } else {
      const drawId = parseInt(value);
      if (!isNaN(drawId)) {
        setSelectedDrawId(drawId);
      }
    }
  };

  const isLoading = isLoadingHistory || isLoadingSeries;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <HistoryIcon className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-amber-500 text-transparent bg-clip-text">Lottery History</h1>
        </div>
      </div>

      {/* Series and Draw Selection */}
      <div className="casino-card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-primary text-sm font-medium mb-2 block">Series</label>
            {isLoadingSeries ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedSeriesIndex?.toString()}
                onValueChange={handleSeriesChange}
              >
                <SelectTrigger className="bg-black/40 border-primary/30">
                  <SelectValue placeholder="Select a series" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-primary/30">
                  <SelectItem value="all">All Series</SelectItem>
                  {seriesList.map((series) => (
                    <SelectItem key={series.index} value={series.index.toString()}>
                      {series.name} (Series #{series.index})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <label className="text-primary text-sm font-medium mb-2 block">Draw</label>
            {isLoadingSeries ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedDrawId?.toString()}
                onValueChange={handleDrawChange}
                disabled={selectedSeriesIndex === undefined}
              >
                <SelectTrigger className="bg-black/40 border-primary/30">
                  <SelectValue placeholder="Select a draw" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-primary/30">
                  <SelectItem value="all">All Draws</SelectItem>
                  {seriesDraws.map((draw) => (
                    <SelectItem key={draw.drawId} value={draw.drawId.toString()}>
                      Draw #{draw.drawId}
                    </SelectItem>
                  ))}
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
                setSelectedSeriesIndex(undefined);
                setSelectedDrawId(undefined);
                clearHistory();
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

        {isLoading ? (
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
                    {history.length > 0 ? (
                      history.map((round) => (
                        <tr key={`${round.seriesIndex}-${round.drawId}`} className="bg-black/20 hover:bg-black/30">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-sm font-semibold text-white">#{round.drawId}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                              Series #{round.seriesIndex}
                            </Badge>
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
                              href={`https://testnet.bscscan.com/address/${round.winnerAddress}`}
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
              {history.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {history.map((round) => (
                    <div key={`winner-${round.seriesIndex}-${round.drawId}`} className="casino-card pt-12 mt-6">
                      <div className="casino-card-header flex justify-between items-center absolute inset-x-0 top-0 px-6 py-4 bg-black/40 border-b border-primary/20 rounded-t-xl">
                        <div className="text-sm uppercase tracking-widest font-bold text-primary flex items-center">
                          <Award className="h-4 w-4 mr-2" />
                          <span className="mr-1">S{round.seriesIndex}</span>
                          Round #{round.drawId}
                        </div>
                        <span className="text-sm font-mono text-white/70">{formatDate(round.endTime)}</span>
                      </div>
                      <div className="p-4 pt-6">
                        {/* Winner */}
                        <div className="mb-4">
                          <div className="text-sm text-primary/80 uppercase tracking-wider font-medium mb-2">Winner</div>
                          <div className="font-mono text-sm truncate">
                            <a 
                              href={`https://testnet.bscscan.com/address/${round.winnerAddress}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-white hover:text-primary transition"
                            >
                              {formatAddress(round.winnerAddress)}
                            </a>
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
