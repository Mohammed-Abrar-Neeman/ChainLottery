import React from 'react';
import { useLotteryData } from '@/hooks/useLotteryData';
import { formatAddress } from '@/lib/web3';
import { ExternalLink, History as HistoryIcon, Award, Info as InfoIcon, Target } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
}

export default function History() {
  const { pastWinners, isLoadingPastWinners, formatUSD } = useLotteryData();
  
  // Format the date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };
  
  // No more mock data - only showing authentic data from the contract
  const displayRounds: RoundData[] = pastWinners as RoundData[] || [];
  
  // Early return if no data is available
  if (displayRounds.length === 0) {
    return (
      <div className="mt-8">
        <div className="flex items-center mb-6">
          <HistoryIcon className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-amber-500 text-transparent bg-clip-text">Lottery History</h1>
        </div>
        
        <div className="casino-card p-12 text-center">
          <div className="rounded-full mx-auto h-16 w-16 bg-black/30 border border-primary/30 flex items-center justify-center mb-4">
            <InfoIcon className="h-8 w-8 text-primary/70" />
          </div>
          <h3 className="text-xl font-medium text-primary">No Historical Data Available</h3>
          <p className="text-white/80 mt-2">
            No past lottery rounds or winners have been found.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-8">
      <div className="flex items-center mb-6">
        <HistoryIcon className="h-6 w-6 text-primary mr-2" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-amber-500 text-transparent bg-clip-text">Lottery History</h1>
      </div>
      
      <Tabs defaultValue="rounds" className="casino-card p-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6 bg-black/40 border-primary/30">
          <TabsTrigger value="rounds" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none">Past Rounds</TabsTrigger>
          <TabsTrigger value="winners" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none">Winners</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rounds">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-black/40">
                  <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Round</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Pool Size</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Participants</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Winner</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">TX</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {displayRounds.map((round) => (
                  <tr key={round.id} className="bg-black/20 hover:bg-black/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-semibold text-white">#{round.roundNumber}</span>
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
                        href={`https://sepolia.etherscan.io/tx/${round.transactionHash}`}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary/60 hover:text-primary transition"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        
        <TabsContent value="winners">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayRounds.map((round) => (
              <div key={`winner-${round.id}`} className="casino-card pt-12 mt-6">
                <div className="casino-card-header flex justify-between items-center absolute inset-x-0 top-0 px-6 py-4 bg-black/40 border-b border-primary/20 rounded-t-xl">
                  <div className="text-sm uppercase tracking-widest font-bold text-primary flex items-center">
                    <Award className="h-4 w-4 mr-2" />
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
                      Winning Ticket #{round.winningTicketIndex !== undefined ? round.winningTicketIndex : "N/A"}
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
                          <Badge key={idx} variant="outline" className="font-mono bg-primary/10 border-primary/30 text-primary rounded-full">
                            {num.toString().padStart(2, '0')}
                          </Badge>
                        ))}
                        {round.winningNumbers[5] && (
                          <Badge key="lotto" variant="default" className="font-mono bg-accent/10 text-accent border-accent/30 rounded-full">
                            {round.winningNumbers[5].toString().padStart(2, '0')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Prize Amount */}
                  <div className="mb-4">
                    <div className="text-sm text-primary/80 uppercase tracking-wider font-medium mb-2">Prize Amount</div>
                    <div className="font-mono text-lg font-bold text-white">{round.prizeAmount} ETH</div>
                    <div className="text-sm text-primary/70">≈ {formatUSD(round.prizeAmount)}</div>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex justify-between text-sm mt-6 pt-4 border-t border-primary/10">
                    <div>
                      <span className="text-white/60">Tickets Sold:</span>
                      <span className="font-mono ml-1 text-white">{round.participantCount}</span>
                    </div>
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${round.transactionHash}`}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
