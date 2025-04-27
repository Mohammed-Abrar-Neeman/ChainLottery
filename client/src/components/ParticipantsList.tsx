import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formatAddress } from '@/lib/utils';
import { getLotteryContract, getDrawParticipants } from '@/lib/lotteryContract';
import { useWallet } from '@/hooks/useWallet';
import { getLotteryAddress } from '@shared/contracts';
import { lotteryABI } from '@shared/lotteryABI';
import { 
  RefreshCcw,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper function to format timestamp into readable date
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  
  // Use Intl.DateTimeFormat for localized formatting
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return formatter.format(date);
};

interface ParticipantsListProps {
  sharedSeriesIndex?: number;
  sharedDrawId?: number;
}

interface Ticket {
  walletAddress: string;
  numbers: number[];
  lottoNumber: number | null;
  timestamp: number;
  ticketId: string;
}

interface ContractData {
  tickets: Ticket[];
  participantCount: number;
}

export default function ParticipantsList({ sharedSeriesIndex, sharedDrawId }: ParticipantsListProps) {
  const { provider, chainId } = useWallet();
  
  // State for storing previous value to detect changes
  const [previousSeriesIndex, setPreviousSeriesIndex] = useState<number | undefined>(undefined);
  const [previousDrawId, setPreviousDrawId] = useState<number | undefined>(undefined);
  
  // Create a local fallback draw ID map to ensure we always have a valid draw ID for each series
  const getDefaultDrawIdForSeries = useCallback((seriesIndex?: number): number => {
    if (seriesIndex === undefined) return 1; // Default to draw 1
    
    // Map series indices to their respective draw IDs (direct mapping from contract)
    switch (seriesIndex) {
      case 0: return 1; // Beginner Series
      case 1: return 2; // Intermediate Series
      case 2: return 3; // Monthly Mega
      case 3: return 4; // Weekly Express
      case 4: return 5; // Quarterly
      case 5: return 6; // Annual
      default: return 1;
    }
  }, []);
  
  // Compute effective draw ID that will never be undefined
  const effectiveDrawId = sharedDrawId !== undefined ? sharedDrawId : getDefaultDrawIdForSeries(sharedSeriesIndex);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");
  // Default to false - we'll only set to true if we can confirm data exists in the contract
  const [isContractDataAvailable, setIsContractDataAvailable] = useState(false);

  // Custom contract read implementation using React Query
  const { data: contractData, error, isLoading, refetch: refetchParticipants } = useQuery({
    queryKey: ['participants', effectiveDrawId, sharedSeriesIndex],
    queryFn: async (): Promise<ContractData> => {
      try {
        console.log(`FORCE FETCH: Getting participants for draw ID ${effectiveDrawId} in series ${sharedSeriesIndex}`);
        
        // Start with the assumption that no data is available
        // This is critical - we'll only set to true if we can confirm data exists
        setIsContractDataAvailable(false);
        
        // We now use effectiveDrawId which will never be undefined, but still guard series index
        if (sharedSeriesIndex === undefined) {
          console.log("Series Index is undefined - no data available");
          throw new Error("Series Index is undefined");
        }
        
        // Use a fallback provider if needed - we don't want this to fail due to wallet connection
        const activeProvider = provider || new ethers.JsonRpcProvider("https://ethereum-sepolia.publicnode.com");
        const activeChainId = chainId || "11155111"; // Sepolia testnet as fallback
        
        console.log(`Using provider: ${!!activeProvider}, chainId: ${activeChainId}`);
        
        // Direct implementation to query the contract
        const contractAddress = getLotteryAddress(activeChainId);
        
        // Check if the contract exists by verifying its code at the address
        const contractCode = await activeProvider.getCode(contractAddress);
        if (contractCode === '0x' || contractCode === '0x0') {
          console.log(`No contract deployed at ${contractAddress}`);
          return { tickets: [], participantCount: 0 };
        }
        
        const contract = new ethers.Contract(contractAddress, lotteryABI, activeProvider);
        
        if (!contract) {
          console.log("Failed to create contract instance");
          throw new Error("Failed to create contract instance");
        }
        
        console.log(`Created contract instance for ${contractAddress}`);
        
        // Get ticket count from contract
        console.log(`Getting ticket count for draw ${effectiveDrawId}...`);
        
        try {
          // First try to check if this draw actually exists in the contract
          let drawExists = false;
          
          try {
            // Check if the draw exists by calling drawExists function
            drawExists = await contract.drawExists(Number(effectiveDrawId));
            console.log(`Draw #${effectiveDrawId} exists check result: ${drawExists}`);
            
            if (!drawExists) {
              console.log(`Draw #${effectiveDrawId} does not exist in the contract`);
              return { tickets: [], participantCount: 0 };
            }
          } catch (error) {
            // If the drawExists function doesn't exist or fails, try another approach
            console.log("Draw existence check failed, trying alternative methods");
            
            try {
              // Try to get the current draw number as an alternative check
              const currentDraw = await contract.getCurrentDraw();
              console.log(`Current draw from contract: ${currentDraw}`);
              
              // If our effectiveDrawId is greater than the current draw, it doesn't exist
              if (Number(effectiveDrawId) > Number(currentDraw)) {
                console.log(`Draw #${effectiveDrawId} > current draw ${currentDraw}, so it doesn't exist`);
                return { tickets: [], participantCount: 0 };
              }
              
              // If we get here, the draw might exist
              drawExists = true;
            } catch (error) {
              console.log("Failed to get current draw, will try to get ticket count directly");
              // We'll continue and try the ticket count method
            }
          }
          
          // At this point we need to verify if tickets exist
          try {
            const totalTickets = await contract.getTotalTicketsSold(Number(effectiveDrawId));
            const ticketCount = Number(totalTickets);
            console.log(`Contract returned ${ticketCount} tickets for draw ${effectiveDrawId}`);
            
            // If we successfully got the ticket count, that confirms draw exists
            // But we only mark data as available if we actually have tickets
            if (ticketCount > 0) {
              setIsContractDataAvailable(true);
              
              // Fetch all tickets directly
              console.log(`Fetching ${ticketCount} tickets for draw ${effectiveDrawId}...`);
              const tickets: Ticket[] = [];
              
              // Limit to a reasonable number to avoid excessive RPC calls
              const maxTicketsToFetch = Math.min(ticketCount, 50);
              
              for (let i = 0; i < maxTicketsToFetch; i++) {
                try {
                  const ticketDetails = await contract.getTicketDetails(Number(effectiveDrawId), i);
                  
                  if (!ticketDetails || !ticketDetails.buyer) {
                    continue;
                  }
                  
                  const walletAddress = ticketDetails.buyer;
                  const numbers = Array.isArray(ticketDetails.numbers) 
                    ? ticketDetails.numbers.map((n: any) => Number(n)) 
                    : [];
                  
                  const lottoNumber = ticketDetails.lottoNumber !== undefined 
                    ? Number(ticketDetails.lottoNumber) 
                    : null;
                    
                  const timestamp = ticketDetails.buyTime 
                    ? Number(ticketDetails.buyTime) * 1000 
                    : Date.now();
                  
                  // Create ticket object
                  const ticket: Ticket = {
                    walletAddress,
                    numbers,
                    lottoNumber,
                    timestamp,
                    ticketId: `${effectiveDrawId}-${i}`
                  };
                  
                  tickets.push(ticket);
                } catch (error) {
                  console.error(`Error getting ticket ${i} details:`, error);
                }
              }
              
              console.log(`Successfully loaded ${tickets.length}/${ticketCount} tickets for draw ${effectiveDrawId}`);
              return { tickets, participantCount: ticketCount };
            } else {
              console.log(`No tickets found for draw ${effectiveDrawId}`);
              
              // No tickets but draw exists - we can conditionally mark as available
              // based on whether we confirmed the draw exists earlier
              if (drawExists) {
                console.log("Draw exists but has no tickets - marking as available but empty");
                setIsContractDataAvailable(true);
              } else {
                console.log("Draw existence uncertain and no tickets - marking as unavailable");
              }
              
              return { tickets: [], participantCount: 0 };
            }
          } catch (error) {
            console.error("Error getting total tickets sold:", error);
            return { tickets: [], participantCount: 0 };
          }
        } catch (e) {
          console.error("Error fetching ticket data:", e);
          
          // If we get an error like "cannot estimate gas", "no such method", or other contract-related errors,
          // it likely means the draw doesn't exist in the smart contract
          const errorMessage = e instanceof Error ? e.message || "" : String(e);
          console.log(`Error message: ${errorMessage}`);
          
          if (
            errorMessage.includes("cannot estimate gas") || 
            errorMessage.includes("no such method") ||
            errorMessage.includes("execution reverted") ||
            errorMessage.includes("invalid opcode") ||
            errorMessage.includes("invalid draw") ||
            errorMessage.includes("nonexistent token")
          ) {
            console.log("Contract error suggests draw doesn't exist");
          }
          
          throw new Error("Failed to fetch ticket data from the blockchain. Please try again.");
        }
      } catch (error: any) {
        console.error("Error in participant data retrieval:", error.message || error);
        throw error;
      }
    },
    enabled: sharedSeriesIndex !== undefined,
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), 10000)
  });
  
  // Manual refresh function for the refresh button
  const handleManualRefresh = useCallback(() => {
    console.log(`🔄 ParticipantsList - Manual refresh triggered for Series ${sharedSeriesIndex}, Draw ${effectiveDrawId}`);
    refetchParticipants();
  }, [refetchParticipants, sharedSeriesIndex, effectiveDrawId]);
  
  // Reset to page 1 when series or draw changes and directly query the smart contract
  useEffect(() => {
    // Guard against undefined series index only (we always have effectiveDrawId)
    if (sharedSeriesIndex === undefined) {
      console.log("⚠️ ParticipantsList - Skipping effect due to undefined series");
      return;
    }
    
    // Reset to first page with any props update
    setCurrentPage(1);
    
    // Log the update for debugging
    console.log(`ParticipantsList - Props updated to series: ${sharedSeriesIndex}, effectiveDrawId: ${effectiveDrawId}`);
    
    // Always query directly from the smart contract - no local storage involved
    console.log(`🔄 ParticipantsList - Directly querying blockchain for Series ${sharedSeriesIndex}, Draw ${effectiveDrawId}`);
    refetchParticipants();
    
  }, [sharedSeriesIndex, effectiveDrawId, refetchParticipants]);
  
  // Get title based on series index
  const getSeriesTitle = () => {
    // If contract data is not available, return a generic title
    if (!isContractDataAvailable) {
      return "Lottery";
    }
    
    switch(sharedSeriesIndex) {
      case 0: return "Beginner Series";
      case 1: return "Intermediate Series";
      case 2: return "Monthly Mega Series";
      case 3: return "Weekly Express Series";
      case 4: return "Quarterly Rewards Series";
      case 5: return "Annual Championship Series";
      default: return "Lottery";
    }
  };
  
  // Get ticket price based on series
  const getTicketPrice = () => {
    switch(sharedSeriesIndex) {
      case 0: return "0.0001";
      case 1: return "0.0002";
      case 2: return "0.0005";
      case 3: return "0.0001";
      case 4: return "0.0008";
      case 5: return "0.001";
      default: return "0.0001";
    }
  };
  
  // No synthetic winner determination - only contract-verified winners should be displayed
  const isTicketWinner = (_ticketId: string): boolean => {
    return false; // No winners displayed unless they come directly from the contract
  };
  
  // Destructure data with fallbacks
  const tickets = contractData?.tickets || [];
  const participantCount = contractData?.participantCount || 0;
  
  // Show improved error state with casino styling
  if (error) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="casino-card p-6">
          <div className="casino-card-header flex justify-between items-center mb-6 -mx-6 -mt-6 px-6 py-4">
            <div className="text-sm uppercase tracking-widest font-bold text-primary">
              {getSeriesTitle()} Participants
            </div>
            <div className="flex items-center space-x-2">
              {!isContractDataAvailable ? (
                <span className="text-sm font-medium text-white/70"><span className="lotto-number">No Data</span></span>
              ) : (
                <span className="text-sm font-medium text-white/70">Draw ID <span className="lotto-number">{effectiveDrawId}</span></span>
              )}
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-yellow-500 text-transparent bg-clip-text">
              Error Loading Participants
            </h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleManualRefresh}
              className="flex items-center border-primary/30 text-primary hover:bg-primary/10 hover:border-primary transition-all"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
          
          <Alert variant="destructive" className="mb-4 bg-black/50 border border-red-500/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-400">
              {error instanceof Error ? error.message : "Failed to fetch participant data. Please try again."}
            </AlertDescription>
          </Alert>
          
          <p className="text-white/70 mt-4">
            The connection to the blockchain may be temporarily unavailable. This is normal and should resolve shortly.
          </p>
          <p className="text-white/70 mt-2">
            Click the "Retry" button above to attempt to reconnect.
          </p>
        </div>
      </section>
    );
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="casino-card p-6">
          <div className="casino-card-header flex justify-between items-center mb-6 -mx-6 -mt-6 px-6 py-4">
            <div className="text-sm uppercase tracking-widest font-bold text-primary">
              {getSeriesTitle()} Participants
            </div>
            <div className="flex items-center space-x-2">
              {!isContractDataAvailable ? (
                <span className="text-sm font-medium text-white/70"><span className="lotto-number">No Data</span></span>
              ) : (
                <span className="text-sm font-medium text-white/70">Draw ID <span className="lotto-number">{effectiveDrawId}</span></span>
              )}
              <span className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"></span>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-yellow-500 text-transparent bg-clip-text">
              Loading Participants...
            </h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleManualRefresh}
              disabled={true}
              className="flex items-center border-primary/30 text-primary/50"
            >
              <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </Button>
          </div>
          
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-white/70">
              Loading participant data from the blockchain...
            </p>
          </div>
        </div>
      </section>
    );
  }
  
  // Show empty state when no tickets are found
  if (!tickets || tickets.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="casino-card p-6">
          <div className="casino-card-header flex justify-between items-center mb-6 -mx-6 -mt-6 px-6 py-4">
            <div className="text-sm uppercase tracking-widest font-bold text-primary">
              {getSeriesTitle()} Participants
            </div>
            <div className="flex items-center space-x-2">
              {!isContractDataAvailable ? (
                <span className="text-sm font-medium text-white/70"><span className="lotto-number">No Data</span></span>
              ) : (
                <span className="text-sm font-medium text-white/70">Draw ID <span className="lotto-number">{effectiveDrawId}</span></span>
              )}
              <span className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"></span>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-yellow-500 text-transparent bg-clip-text">
              Current Participants
            </h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="flex items-center border-primary/30 text-primary hover:bg-primary/10 hover:border-primary transition-all"
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <div className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/5 mb-4">
              <AlertCircle className="h-8 w-8 text-primary/40" />
            </div>
            <p className="text-white/70 mt-2">
              {!isContractDataAvailable ? (
                <>No Data</>
              ) : sharedSeriesIndex !== undefined ? (
                <>No participants found</>
              ) : (
                "No participant data available."
              )}
            </p>
          </div>
        </div>
      </section>
    );
  }
  
  // If we reach here, we have participants data to display
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="casino-card p-6">
        <div className="casino-card-header flex justify-between items-center mb-6 -mx-6 -mt-6 px-6 py-4">
          <div className="text-sm uppercase tracking-widest font-bold text-primary">
            {getSeriesTitle()} Participants
          </div>
          <div className="flex items-center space-x-2">
            {!isContractDataAvailable ? (
              <span className="text-sm font-medium text-white/70"><span className="lotto-number">No Data</span></span>
            ) : (
              <span className="text-sm font-medium text-white/70">Draw ID <span className="lotto-number">{effectiveDrawId}</span></span>
            )}
            <span className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"></span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-yellow-500 text-transparent bg-clip-text">
            Recent Ticket Purchases
          </h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="flex items-center border-primary/30 text-primary hover:bg-primary/10 hover:border-primary transition-all"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <p className="text-md mb-4 font-medium text-white/80">
          Currently showing <span className="lotto-number">{tickets.length}</span> tickets from <span className="lotto-number">{new Set(tickets.map(p => p.walletAddress)).size}</span> participants
        </p>
        
        {/* Display participant data here */}
        {tickets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tickets.map((ticket) => (
              <div key={ticket.ticketId} className="bg-black/30 backdrop-blur-sm border border-primary/30 rounded-lg p-4 transition-all hover:border-primary/60">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-mono text-primary">
                    Ticket #{ticket.ticketId}
                  </div>
                  <div className="text-xs text-white/60">
                    {formatTimestamp(ticket.timestamp)}
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="text-xs text-white/70 mb-1">Wallet Address</div>
                  <div className="font-mono text-sm truncate text-white/90">
                    {formatAddress(ticket.walletAddress)}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-white/70 mb-1">Selected Numbers</div>
                  <div className="flex flex-wrap gap-2">
                    {ticket.numbers.map((num, index) => (
                      <div key={index} className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
                        <span className="text-sm font-mono text-white">{num.toString().padStart(2, '0')}</span>
                      </div>
                    ))}
                    
                    {ticket.lottoNumber !== null && (
                      <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center border border-primary">
                        <span className="text-sm font-mono text-white">{ticket.lottoNumber.toString().padStart(2, '0')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-white/70 py-16 bg-black/20 border border-primary/10 rounded-lg">
            <p className="mb-2 text-lg">No participant data available for this draw</p>
            <p className="text-sm text-white/50">Be the first to buy a ticket!</p>
          </div>
        )}
      </div>
    </section>
  );
}