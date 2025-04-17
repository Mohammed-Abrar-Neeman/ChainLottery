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
  const displayRounds = pastWinners || [];
  
  // Early return if no data is available
  if (displayRounds.length === 0) {
    return (
      <div className="mt-8">
        <div className="flex items-center mb-6">
          <HistoryIcon className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-2xl font-bold">Lottery History</h1>
        </div>
        
        <div className="glass rounded-2xl shadow-glass p-12 text-center">
          <InfoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-600">No Historical Data Available</h3>
          <p className="text-gray-500 mt-2">
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
        <h1 className="text-2xl font-bold">Lottery History</h1>
      </div>
      
      <Tabs defaultValue="rounds" className="glass rounded-2xl shadow-glass p-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
          <TabsTrigger value="rounds">Past Rounds</TabsTrigger>
          <TabsTrigger value="winners">Winners</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rounds">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100 bg-opacity-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pool Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TX</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayRounds.map((round) => (
                  <tr key={round.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-semibold">#{round.roundNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(round.endTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                      {round.poolAmount} ETH
                      <div className="text-xs text-gray-500">
                        ≈ {formatUSD(round.poolAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {round.participantCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                      <a 
                        href={`https://etherscan.io/address/${round.winnerAddress}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-accent transition flex items-center"
                      >
                        {formatAddress(round.winnerAddress)}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <a 
                        href={`https://etherscan.io/tx/${round.transactionHash}`}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-400 hover:text-primary transition"
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
              <div key={`winner-${round.id}`} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-primary to-accent p-4 text-white">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold flex items-center">
                      <Award className="h-4 w-4 mr-1" />
                      Round #{round.roundNumber}
                    </span>
                    <span className="text-sm font-mono">{formatDate(round.endTime)}</span>
                  </div>
                </div>
                <div className="p-5">
                  {/* Winner */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Winner</div>
                    <div className="font-mono text-sm truncate">
                      <a 
                        href={`https://sepolia.etherscan.io/address/${round.winnerAddress}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-accent transition"
                      >
                        {formatAddress(round.winnerAddress)}
                      </a>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Winning Ticket #{round.winningTicketIndex !== undefined ? round.winningTicketIndex : "N/A"}
                    </div>
                  </div>
                  
                  {/* Winning Numbers */}
                  {round.winningNumbers && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 mb-2 flex items-center">
                        <Target size={14} className="mr-1" /> Winning Numbers
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {round.winningNumbers.slice(0, 5).map((num, idx) => (
                          <Badge key={idx} variant="outline" className="font-mono bg-gray-50 rounded-full">
                            {num.toString().padStart(2, '0')}
                          </Badge>
                        ))}
                        {round.winningNumbers[5] && (
                          <Badge key="lotto" variant="default" className="font-mono rounded-full">
                            {round.winningNumbers[5].toString().padStart(2, '0')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Prize Amount */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Prize Amount</div>
                    <div className="font-mono text-lg font-bold">{round.prizeAmount} ETH</div>
                    <div className="text-sm text-gray-500">≈ {formatUSD(round.prizeAmount)}</div>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="text-gray-500">Tickets Sold:</span>
                      <span className="font-mono ml-1">{round.participantCount}</span>
                    </div>
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${round.transactionHash}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-accent transition flex items-center"
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
