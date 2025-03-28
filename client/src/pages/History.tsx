import React from 'react';
import { useLotteryData } from '@/hooks/useLotteryData';
import { formatAddress } from '@/lib/web3';
import { ExternalLink, History as HistoryIcon, Award } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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
  
  // Mock data for development
  const mockPastRounds = [
    {
      id: 1,
      roundNumber: 41,
      startTime: new Date(Date.now() - 48 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      poolAmount: "2.84",
      winnerAddress: "0x8F3A547D887D",
      prizeAmount: "1.988",
      participantCount: 142,
      isFinalized: true,
      transactionHash: "0x7ae7b3b42f"
    },
    {
      id: 2,
      roundNumber: 40,
      startTime: new Date(Date.now() - 72 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 48 * 60 * 60 * 1000),
      poolAmount: "3.12",
      winnerAddress: "0x3A2B7C8D554E",
      prizeAmount: "2.184",
      participantCount: 163,
      isFinalized: true,
      transactionHash: "0x8bd9c5e2f1"
    },
    {
      id: 3,
      roundNumber: 39,
      startTime: new Date(Date.now() - 96 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 72 * 60 * 60 * 1000),
      poolAmount: "2.96",
      winnerAddress: "0x5C4E7F8D664C",
      prizeAmount: "2.072",
      participantCount: 151,
      isFinalized: true,
      transactionHash: "0x9fe8d2c1a0"
    },
    {
      id: 4,
      roundNumber: 38,
      startTime: new Date(Date.now() - 120 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 96 * 60 * 60 * 1000),
      poolAmount: "2.75",
      winnerAddress: "0x2A1B3C4D887D",
      prizeAmount: "1.925",
      participantCount: 138,
      isFinalized: true,
      transactionHash: "0x1a2b3c4d5e"
    },
    {
      id: 5,
      roundNumber: 37,
      startTime: new Date(Date.now() - 144 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 120 * 60 * 60 * 1000),
      poolAmount: "3.05",
      winnerAddress: "0x6E7F8D9C0B1A",
      prizeAmount: "2.135",
      participantCount: 156,
      isFinalized: true,
      transactionHash: "0xf1e2d3c4b5a"
    }
  ];
  
  const displayRounds = pastWinners || mockPastRounds;
  
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
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Winner</div>
                    <div className="font-mono text-sm truncate">
                      <a 
                        href={`https://etherscan.io/address/${round.winnerAddress}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-accent transition"
                      >
                        {formatAddress(round.winnerAddress)}
                      </a>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Prize Amount</div>
                    <div className="font-mono text-lg font-bold">{round.prizeAmount} ETH</div>
                    <div className="text-sm text-gray-500">≈ {formatUSD(round.prizeAmount)}</div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="text-gray-500">Tickets Sold:</span>
                      <span className="font-mono ml-1">{round.participantCount}</span>
                    </div>
                    <a 
                      href={`https://etherscan.io/tx/${round.transactionHash}`}
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
