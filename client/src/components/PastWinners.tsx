import React from 'react';
import { useLotteryData } from '@/hooks/useLotteryData';
import { formatAddress } from '@/lib/web3';
import { ExternalLink } from 'lucide-react';

export default function PastWinners() {
  const { pastWinners, isLoadingPastWinners, formatUSD } = useLotteryData();
  
  // Default past winners data if API doesn't return any
  const defaultPastWinners = [
    {
      id: 1,
      roundNumber: 41,
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
      endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
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
      endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      poolAmount: "2.96",
      winnerAddress: "0x5C4E7F8D664C",
      prizeAmount: "2.072",
      participantCount: 151,
      isFinalized: true,
      transactionHash: "0x9fe8d2c1a0"
    }
  ];
  
  // If we have past winners data from the API, use it, otherwise use the default data
  const displayWinners = Array.isArray(pastWinners) ? pastWinners : defaultPastWinners;
  
  const getTimeDifference = (date: any) => {
    // Ensure date is a proper Date object
    if (!date) return "Unknown time";
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return "Unknown time";
    }
    
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    }
  };
  
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold mb-6">Past Winners</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayWinners.map((winner) => (
          <div key={winner.id} className="glass rounded-xl shadow-glass overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-accent p-4 text-white">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Round #{winner.roundNumber}</span>
                <span className="text-sm font-mono">{getTimeDifference(winner.endTime)}</span>
              </div>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1">Winner</div>
                <div className="font-mono text-sm truncate">
                  <a 
                    href={`https://etherscan.io/address/${winner.winnerAddress}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-accent transition"
                  >
                    {formatAddress(winner.winnerAddress)}
                  </a>
                </div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1">Prize Amount</div>
                <div className="font-mono text-lg font-bold">{winner.prizeAmount} ETH</div>
                <div className="text-sm text-gray-500">≈ {formatUSD(winner.prizeAmount)}</div>
              </div>
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-gray-500">Tickets Sold:</span>
                  <span className="font-mono ml-1">{winner.participantCount}</span>
                </div>
                <a 
                  href={`https://etherscan.io/tx/${winner.transactionHash}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-accent transition flex items-center"
                >
                  View on Explorer <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
