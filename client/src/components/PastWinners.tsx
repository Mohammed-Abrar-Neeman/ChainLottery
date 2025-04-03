import React, { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useLotteryData } from '@/hooks/useLotteryData';
import { formatAddress } from '@/lib/web3';
import { ExternalLink, AlertTriangle, RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Winner, getDrawWinners } from '@/lib/lotteryContract';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface PastWinnersProps {
  sharedDrawId?: number;
}

export default function PastWinners({ sharedDrawId }: PastWinnersProps) {
  const { provider, chainId } = useWallet();
  const { hasAvailableDraws: isDrawAvailable, formatUSD } = useLotteryData();
  
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if draws are available
  const drawsAvailable = isDrawAvailable();
  
  // Load winners for the selected draw
  useEffect(() => {
    const fetchWinners = async () => {
      if (!provider || !chainId || !sharedDrawId) {
        // Reset winners if prerequisites aren't met
        setWinners([]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        console.log(`Fetching winners for draw ID: ${sharedDrawId}`);
        
        const fetchedWinners = await getDrawWinners(provider, chainId, sharedDrawId);
        console.log(`Fetched ${fetchedWinners.length} winners for draw ${sharedDrawId}`, fetchedWinners);
        
        setWinners(fetchedWinners);
      } catch (err) {
        console.error('Error fetching winners:', err);
        setError('Failed to load winner data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWinners();
  }, [provider, chainId, sharedDrawId]);
  
  const refreshWinners = () => {
    if (provider && chainId && sharedDrawId) {
      setIsLoading(true);
      setError(null);
      
      getDrawWinners(provider, chainId, sharedDrawId)
        .then(fetchedWinners => {
          setWinners(fetchedWinners);
        })
        .catch(err => {
          console.error('Error refreshing winners:', err);
          setError('Failed to refresh winner data. Please try again later.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };
  
  const getTimeDifference = (timestamp: number | undefined) => {
    if (!timestamp) return "Unknown time";
    
    const now = Date.now();
    const diffHours = Math.floor((now - timestamp) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    }
  };
  
  // Helper for prize tiers
  const getPrizeTier = (amount: string) => {
    const amountNum = parseFloat(amount);
    if (amountNum >= 1) return "jackpot";
    if (amountNum >= 0.1) return "major";
    return "minor";
  };
  
  return (
    <section className="mb-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Past Winners</h2>
        
        {drawsAvailable && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshWinners} 
            disabled={isLoading}
            className="flex items-center"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {!drawsAvailable || (!isLoading && winners.length === 0) ? (
        <Alert variant="default" className="mb-6">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>
            No past winners available for Draw #{sharedDrawId || 'N/A'}. Winners will appear once draws are completed.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-xl shadow-glass overflow-hidden">
                  <Skeleton className="h-16 w-full mb-2" />
                  <div className="p-5">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-8 w-full mb-2" />
                    <Skeleton className="h-6 w-1/2 mb-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {winners.map((winner, index) => (
                <div key={`${winner.winnerAddress}-${index}`} className="glass rounded-xl shadow-glass overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-accent p-4 text-white">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Draw #{winner.drawId || sharedDrawId}</span>
                      <span className="text-sm font-mono">{getTimeDifference(winner.timestamp)}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 mb-1">Winner</div>
                      <div className="font-mono text-sm truncate">
                        <a 
                          href={`https://sepolia.etherscan.io/address/${winner.winnerAddress}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-accent transition"
                        >
                          {formatAddress(winner.winnerAddress)}
                        </a>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500 mb-1">Prize Amount</div>
                        <Badge 
                          variant={getPrizeTier(winner.amountWon) === 'jackpot' ? 'destructive' : 
                                 getPrizeTier(winner.amountWon) === 'major' ? 'default' : 'outline'}
                        >
                          {getPrizeTier(winner.amountWon) === 'jackpot' ? 'Jackpot' : 
                           getPrizeTier(winner.amountWon) === 'major' ? 'Major Prize' : 'Prize'}
                        </Badge>
                      </div>
                      <div className="font-mono text-lg font-bold">{winner.amountWon} ETH</div>
                      <div className="text-sm text-gray-500">≈ {formatUSD(winner.amountWon)}</div>
                    </div>
                    {winner.transactionHash && (
                      <div className="flex justify-end text-sm">
                        <a 
                          href={`https://sepolia.etherscan.io/tx/${winner.transactionHash}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-accent transition flex items-center"
                        >
                          View on Explorer <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}