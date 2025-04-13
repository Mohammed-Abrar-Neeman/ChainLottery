import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useLotteryData } from '@/hooks/useLotteryData';
import { formatAddress, formatEther } from '@/lib/web3';
import { ExternalLink, AlertTriangle, RefreshCcw, Trophy } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Winner, getDrawWinners, getTotalWinners, getDrawInfo } from '@/lib/lotteryContract';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ethers } from 'ethers';
import { lotteryABI } from '@shared/lotteryABI';
import { getLotteryAddress } from '@shared/contracts';

interface PastWinnersProps {
  sharedDrawId?: number;
}

export default function PastWinners({ sharedDrawId }: PastWinnersProps) {
  const { provider, chainId } = useWallet();
  const { hasAvailableDraws: isDrawAvailable, formatUSD } = useLotteryData();
  
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawCompleted, setIsDrawCompleted] = useState(false);
  const [totalWinnersCount, setTotalWinnersCount] = useState<number>(0);
  
  // Check if draws are available
  const drawsAvailable = isDrawAvailable();

  // Check if draw is completed
  const checkDrawCompletion = useCallback(async () => {
    if (!provider || !chainId || !sharedDrawId) return false;
    
    try {
      // Get draw info to check completed status
      const draw = await getDrawInfo(provider, chainId, sharedDrawId);
      if (!draw) {
        console.log(`No draw info found for draw ${sharedDrawId}`);
        return false;
      }
      console.log(`Draw ${sharedDrawId} completion status:`, draw.completed);
      return draw.completed;
    } catch (error) {
      console.error(`Error checking if draw ${sharedDrawId} is completed:`, error);
      return false;
    }
  }, [provider, chainId, sharedDrawId]);

  // Get total winners count
  const fetchTotalWinners = useCallback(async () => {
    if (!provider || !chainId) return;
    
    try {
      // Try to get total winners count
      const totalWinners = await getTotalWinners(provider, chainId);
      console.log(`Total winners across all draws: ${totalWinners}`);
      setTotalWinnersCount(totalWinners);
    } catch (error) {
      console.error('Error fetching total winners count:', error);
    }
  }, [provider, chainId]);

  // Get winners directly from contract winners mapping
  const fetchWinnersFromContract = useCallback(async () => {
    if (!provider || !chainId || !sharedDrawId) return [];
    
    try {
      console.log(`Directly accessing winners mapping for draw ${sharedDrawId}`);
      const lotteryAddress = getLotteryAddress(chainId);
      const contract = new ethers.Contract(lotteryAddress, lotteryABI, provider);
      
      // Try to get winners array from the winners mapping
      const results = await contract.winners(sharedDrawId);
      console.log(`Raw winners data from contract mapping for draw ${sharedDrawId}:`, results);
      
      if (!results || results.length === 0) {
        console.log(`No winners found in contract mapping for draw ${sharedDrawId}`);
        return [];
      }
      
      // Format the winners data
      return results.map((winner: any) => ({
        winnerAddress: winner.winnerAddress,
        amountWon: ethers.formatEther(winner.amountWon),
        drawId: sharedDrawId,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error(`Error fetching winners from contract mapping for draw ${sharedDrawId}:`, error);
      return [];
    }
  }, [provider, chainId, sharedDrawId]);
  
  // Track the previous draw ID to detect changes
  const [previousDrawId, setPreviousDrawId] = useState<number | undefined>(undefined);

  // Load winners for the selected draw using multiple methods
  useEffect(() => {
    // Reset on draw ID change
    if (previousDrawId !== undefined && sharedDrawId !== previousDrawId) {
      console.log(`PastWinners - Draw ID changed from ${previousDrawId} to ${sharedDrawId}, clearing winners`);
      setWinners([]);
    }
    
    // Update the tracked draw ID
    setPreviousDrawId(sharedDrawId);
    
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
        console.log(`PastWinners - Fetching winners for draw ID: ${sharedDrawId}`);
        
        // 1. Check if draw is completed
        const completed = await checkDrawCompletion();
        setIsDrawCompleted(completed);
        
        // 2. Get total winners count
        await fetchTotalWinners();
        
        // 3. Try multiple methods to get winners
        let fetchedWinners: Winner[] = [];
        
        // First try the helper function that uses getWinners
        try {
          fetchedWinners = await getDrawWinners(provider, chainId, sharedDrawId);
          console.log(`PastWinners - Fetched ${fetchedWinners.length} winners using getWinners for draw ${sharedDrawId}`);
        } catch (error) {
          console.error(`PastWinners - Error using getWinners for draw ${sharedDrawId}:`, error);
        }
        
        // If no winners found, try direct mapping access
        if (fetchedWinners.length === 0) {
          try {
            const directWinners = await fetchWinnersFromContract();
            if (directWinners.length > 0) {
              fetchedWinners = directWinners;
              console.log(`PastWinners - Fetched ${directWinners.length} winners using direct mapping access`);
            }
          } catch (error) {
            console.error(`PastWinners - Error using direct mapping access:`, error);
          }
        }
        
        console.log(`PastWinners - Final winner count for draw ${sharedDrawId}: ${fetchedWinners.length}`, fetchedWinners);
        setWinners(fetchedWinners);
      } catch (err) {
        console.error('PastWinners - Error fetching winners:', err);
        setError('Failed to load winner data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWinners();
  }, [provider, chainId, sharedDrawId, checkDrawCompletion, fetchTotalWinners, fetchWinnersFromContract, previousDrawId]);
  
  const refreshWinners = () => {
    if (provider && chainId && sharedDrawId) {
      setIsLoading(true);
      setError(null);
      
      Promise.all([
        checkDrawCompletion(),
        getDrawWinners(provider, chainId, sharedDrawId),
        fetchWinnersFromContract()
      ])
        .then(([completed, drawnWinners, contractWinners]) => {
          setIsDrawCompleted(completed);
          // Use winner data that has more entries
          const finalWinners = contractWinners.length > drawnWinners.length ? contractWinners : drawnWinners;
          setWinners(finalWinners);
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
          <div className="flex items-start gap-2">
            {isDrawCompleted ? (
              <Trophy className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            <AlertDescription className="flex-1">
              {isDrawCompleted ? (
                <>
                  <span className="font-semibold">Draw #{sharedDrawId || 'N/A'} is complete</span>, but no winners were found in this draw. 
                  This could happen if no tickets matched the winning numbers or if the winners data hasn't been recorded yet on the blockchain.
                  {totalWinnersCount > 0 && (
                    <p className="mt-1">There are {totalWinnersCount} winners in total across all draws.</p>
                  )}
                </>
              ) : (
                <>
                  No past winners available for Draw #{sharedDrawId || 'N/A'}. Winners will appear once draws are completed.
                </>
              )}
            </AlertDescription>
          </div>
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
                    
                    {winner.ticketNumbers && winner.ticketNumbers.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-1">Winning Ticket</div>
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          {winner.ticketNumbers[0].numbers.map((num, i) => (
                            <span 
                              key={`number-${i}`} 
                              className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full bg-primary-100 text-primary"
                            >
                              {num}
                            </span>
                          ))}
                          {winner.ticketNumbers[0].lottoNumber && (
                            <span 
                              className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full bg-accent text-white"
                            >
                              {winner.ticketNumbers[0].lottoNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
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