import React from 'react';
import { useLotteryData } from '@/hooks/useLotteryData';
import { formatAddress } from '@/lib/web3';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PastWinners() {
  const { pastWinners, isLoadingPastWinners, formatUSD, areDrawsAvailable } = useLotteryData();
  
  // Check if draws are available
  const drawsAvailable = areDrawsAvailable();
  
  // If no draws are available, we should show empty state
  const displayWinners = drawsAvailable && Array.isArray(pastWinners) && pastWinners.length > 0 ? pastWinners : [];
  
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
      
      {!drawsAvailable || displayWinners.length === 0 ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>
            No past winners available. Past winner data will appear once draws are completed.
          </AlertDescription>
        </Alert>
      ) : (
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
      )}
    </section>
  );
}