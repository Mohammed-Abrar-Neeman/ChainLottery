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
        
        try {
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
        } catch (e) {
          console.error("Error fetching ticket data:", e);
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
              <span className="text-sm font-medium text-white/70">Draw ID {effectiveDrawId}</span>
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
              <span className="text-sm font-medium text-white/70">Draw ID {effectiveDrawId}</span>
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
            <p className="text-white/70 mt-2">
              Fetching participant data from blockchain...
            </p>
            <p className="text-white/50 text-sm mt-1">
              This may take a moment
            </p>
          </div>
        </div>
      </section>
    );
  }
  
  // Empty state handler
  if (tickets.length === 0) {
    // If we have valid series index, attempt another fetch (once only)
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
    
    // Render empty state
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="casino-card p-6">
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
              {sharedSeriesIndex !== undefined
                ? `No participants found for Series ${sharedSeriesIndex}, Draw ID ${effectiveDrawId}.`
                : "Please select a Series to view participants."}
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
          Currently showing {tickets.length} tickets from {new Set(tickets.map(p => p.walletAddress)).size} participants
        </p>
        
        {/* Display participant data here */}
        <div className="text-center text-white/70 py-4">
          {tickets.length > 0 ? (
            <p>Participant data successfully loaded from blockchain.</p>
          ) : (
            <p>No participant data available.</p>
          )}
        </div>
      </div>
    </section>
  );
}