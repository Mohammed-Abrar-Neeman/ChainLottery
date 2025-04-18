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

  // Custom contract read implementation using React Query
  const { data: contractData, error, isLoading, refetch: refetchParticipants } = useQuery({
    queryKey: ['participants', effectiveDrawId, sharedSeriesIndex],
    queryFn: async (): Promise<ContractData> => {
      try {
        console.log(`FORCE FETCH: Getting participants for draw ID ${effectiveDrawId} in series ${sharedSeriesIndex}`);
        
        // We now use effectiveDrawId which will never be undefined, but still guard series index
        if (sharedSeriesIndex === undefined) {
          throw new Error("Series Index is undefined");
        }
        
        // Use a fallback provider if needed - we don't want this to fail due to wallet connection
        const activeProvider = provider || new ethers.JsonRpcProvider("https://ethereum-sepolia.publicnode.com");
        const activeChainId = chainId || "11155111"; // Sepolia testnet as fallback
        
        console.log(`Using provider: ${!!activeProvider}, chainId: ${activeChainId}`);
        
        // Direct implementation to query the contract
        const contractAddress = getLotteryAddress(activeChainId);
        const contract = new ethers.Contract(contractAddress, lotteryABI, activeProvider);
        
        if (!contract) {
          throw new Error("Failed to create contract instance");
        }
        
        console.log(`Created contract instance for ${contractAddress}`);
        
        // Get ticket count from contract
        console.log(`Getting ticket count for draw ${effectiveDrawId}...`);
        const totalTickets = await contract.getTotalTicketsSold(Number(effectiveDrawId));
        const ticketCount = Number(totalTickets);
        console.log(`Contract returned ${ticketCount} tickets for draw ${effectiveDrawId}`);
        
        if (ticketCount === 0) {
          console.log(`No tickets found for draw ${effectiveDrawId}`);
          return { tickets: [], participantCount: 0 };
        }
        
        // Fetch all tickets directly
        console.log(`Fetching ${ticketCount} tickets for draw ${effectiveDrawId}...`);
        const tickets: Ticket[] = [];
        
        for (let i = 0; i < ticketCount; i++) {
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
      } catch (error: any) {
        console.error("Error in participant data retrieval:", error.message || error);
        return { tickets: [], participantCount: 0 };
      }
    },
    enabled: sharedSeriesIndex !== undefined, // We always have effectiveDrawId, so only check seriesIndex
    staleTime: 30000, // Keep data fresh for 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true
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
  
  // Destructure data with fallbacks
  const tickets = contractData?.tickets || [];
  const participantCount = contractData?.participantCount || 0;
  
  // REFACTORING: Extract the participants view into a reusable function
  // This allows us to call it either with contract data or with guaranteed data
  const renderParticipantsView = (ticketsToRender: Ticket[], participantCount: number) => {
    console.log(`✅ Showing ${ticketsToRender.length} participants for Series ${sharedSeriesIndex}, Draw ID ${effectiveDrawId}`);
    
    // Pagination calculations
    const totalTickets = ticketsToRender.length;
    const pageCount = Math.max(1, Math.ceil(totalTickets / parseInt(pageSize)));
    const startIndex = (currentPage - 1) * parseInt(pageSize);
    const endIndex = startIndex + parseInt(pageSize);
    const currentTickets = ticketsToRender.slice(startIndex, endIndex);
    
    // Debug log
    console.log("🎫 SHOWING TICKETS:", { 
      totalTickets,
      currentTicketsCount: currentTickets.length,
      pageSize,
      currentPage
    });
    
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="casino-card p-6 overflow-hidden">
          <div className="casino-card-header flex justify-between items-center mb-6 -mx-6 -mt-6 px-6 py-4">
            <div className="text-sm uppercase tracking-widest font-bold text-primary">
              {getSeriesTitle()} Participants
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-white/70">Draw ID {effectiveDrawId}</span>
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
            Currently showing {totalTickets} tickets from {new Set(ticketsToRender.map(p => p.walletAddress)).size} participants
          </p>
          
          <div className="overflow-x-auto">
            <div className="w-full min-w-full">
              <table className="min-w-full divide-y divide-primary/10">
                <thead className="bg-black/40">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">
                      Participant
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">
                      Numbers
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {currentTickets.map((ticket) => (
                    <tr key={ticket.ticketId} className={isTicketWinner(ticket.ticketId) ? 'bg-primary/5' : 'bg-black/20 hover:bg-black/30'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-white/90">
                              {formatAddress(ticket.walletAddress)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          {ticket.numbers.map((num, idx) => (
                            <span 
                              key={idx}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary border border-primary/30 text-xs font-medium"
                            >
                              {num.toString().padStart(2, '0')}
                            </span>
                          ))}
                          
                          {ticket.lottoNumber !== null && (
                            <span 
                              className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-accent/10 text-accent border border-accent/30 text-xs font-medium ml-2"
                            >
                              {ticket.lottoNumber.toString().padStart(2, '0')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white/80">
                          {formatTimestamp(ticket.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isTicketWinner(ticket.ticketId) ? (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/20 text-green-400 border border-green-500/30">
                            Winner!
                          </span>
                        ) : (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary/80 border border-primary/20">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-primary font-medium">
                        {getTicketPrice()} ETH
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination controls */}
            <div className="px-4 py-6 flex flex-col md:flex-row items-center justify-between sm:px-6 mt-4 gap-4 border-t border-primary/10">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white/70">Show</span>
                <Select value={pageSize} onValueChange={(value) => {
                  setPageSize(value);
                  setCurrentPage(1); // Reset to first page when changing page size
                }}>
                  <SelectTrigger className="h-8 w-20 bg-black/30 border-primary/20 text-white">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-primary/20">
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-white/70">entries</span>
              </div>
              
              <div className="flex items-center justify-between md:justify-end">
                <p className="text-sm text-white/80">
                  Showing <span className="font-medium text-primary">{startIndex + 1}</span> to <span className="font-medium text-primary">{Math.min(endIndex, totalTickets)}</span> of <span className="font-medium text-primary">{totalTickets}</span> tickets
                </p>
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={`${currentPage === 1 ? "opacity-50 pointer-events-none" : "cursor-pointer"} bg-black/20 border-primary/20 text-white hover:bg-primary/10 hover:text-primary`}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, pageCount) }).map((_, i) => {
                    let pageNumber: number;
                    
                    // Logic to show appropriate page numbers
                    if (pageCount <= 5 || currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= pageCount - 2) {
                      pageNumber = pageCount - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    // Only render if page number is valid
                    if (pageNumber > 0 && pageNumber <= pageCount) {
                      return (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNumber)}
                            isActive={currentPage === pageNumber}
                            className={currentPage === pageNumber 
                              ? "bg-primary text-black font-bold" 
                              : "bg-black/20 border-primary/20 text-white hover:bg-primary/10 hover:text-primary"}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  {pageCount > 5 && currentPage < pageCount - 2 && (
                    <>
                      <PaginationItem>
                        <PaginationEllipsis className="bg-black/20 border-primary/20 text-white" />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink 
                          onClick={() => setCurrentPage(pageCount)}
                          className="bg-black/20 border-primary/20 text-white hover:bg-primary/10 hover:text-primary"
                        >
                          {pageCount}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
                      className={`${currentPage === pageCount ? "opacity-50 pointer-events-none" : "cursor-pointer"} bg-black/20 border-primary/20 text-white hover:bg-primary/10 hover:text-primary`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </div>
      </section>
    );
  };
  
  // Common rendering function for empty state
  const renderEmptyState = () => {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="p-6 rounded-lg shadow-lg bg-white dark:bg-slate-900">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-blue-600">Current Participants</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="flex items-center"
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <div className="text-center py-8">
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No participant data available for the selected Series/Draw.
              </AlertDescription>
            </Alert>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {sharedSeriesIndex !== undefined
                ? `No participants found for Series ${sharedSeriesIndex}, Draw ID ${effectiveDrawId}.`
                : "Please select a Series to view participants."}
            </p>
          </div>
        </div>
      </section>
    );
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="p-6 rounded-lg shadow-lg bg-white dark:bg-slate-900">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-blue-600">Loading Participants...</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleManualRefresh}
              disabled={true}
              className="flex items-center"
            >
              <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </Button>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Fetching participant data from blockchain...</span>
          </div>
        </div>
      </section>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="p-6 rounded-lg shadow-lg bg-white dark:bg-slate-900">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-blue-600">Error Loading Participants</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleManualRefresh}
              className="flex items-center"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
          
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading participants: {error instanceof Error ? error.message : "Unknown error"}
            </AlertDescription>
          </Alert>
        </div>
      </section>
    );
  }
  
  // Always use direct contract data - no fallback or guaranteed data
  console.log(`ParticipantsList - Using direct contract data for Series ${sharedSeriesIndex}, Draw ${effectiveDrawId}`);
  console.log(`Contract data tickets length: ${tickets.length}`);
  
  // Check for zero tickets - but don't immediately render empty state
  // Instead verify we have valid props and attempt a refresh
  if (tickets.length === 0) {
    // If we have valid series index (we always have effectiveDrawId), attempt another fetch (once only)
    if (sharedSeriesIndex !== undefined) {
      // Trigger a refresh if it's the first time we're seeing this combination
      if (previousSeriesIndex !== sharedSeriesIndex || previousDrawId !== effectiveDrawId) {
        console.log(`FORCE REFRESH: No tickets found for Series ${sharedSeriesIndex}, Draw ${effectiveDrawId}`);
        
        // Update the previous values to prevent infinite refresh
        setPreviousSeriesIndex(sharedSeriesIndex);
        setPreviousDrawId(effectiveDrawId);
        
        // Trigger a refresh with a small delay to ensure params are set
        setTimeout(() => {
          refetchParticipants();
        }, 500);
      }
    }
    
    // Render empty state if we're not loading
    if (!isLoading) {
      return renderEmptyState();
    }
  }
  
  // No synthetic winner determination - only contract-verified winners should be displayed
  // For now, since we're not fetching winner info in this component, all tickets are 'Active'
  const isTicketWinner = (_ticketId: string): boolean => {
    return false; // No winners displayed unless they come directly from the contract
  };
  
  // Get title based on series index
  const getSeriesTitle = () => {
    switch(sharedSeriesIndex) {
      case 0: return "Beginner Series";
      case 1: return "Intermediate Series";
      case 2: return "Monthly Mega Series";
      case 3: return "Weekly Express Series";
      case 4: return "Quarterly Rewards Series";
      case 5: return "Annual Championship Series";
      default: return "Lottery Series";
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
  
  // If we have valid participants data, render them
  return renderParticipantsView(tickets, participantCount);
}