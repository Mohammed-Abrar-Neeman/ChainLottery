import React, { useState, useEffect } from 'react';
import { useLotteryData } from '@/hooks/useLotteryData';
import { formatAddress, formatEther } from '@/lib/web3';
import { ExternalLink, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ParticipantsListProps {
  sharedDrawId?: number;
}

export default function ParticipantsList({ sharedDrawId }: ParticipantsListProps) {
  const { 
    lotteryData, 
    drawParticipants,
    isLoadingDrawParticipants,
    selectedDrawId,
    refetchDrawParticipants,
    enhancedRefetchParticipants, // Use the enhanced version that accepts a draw ID
    formatUSD, 
    hasAvailableDraws: isDrawAvailable,
    getSelectedDrawTicketPrice
  } = useLotteryData();
  
  const [pageSize, setPageSize] = useState<string>("10");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Synchronize with the shared draw ID from parent component
  useEffect(() => {
    if (sharedDrawId !== undefined) {
      console.log("ParticipantsList - Updating from sharedDrawId:", sharedDrawId);
      
      // If the sharedDrawId is different from the selectedDrawId, we need to update it
      if (sharedDrawId !== selectedDrawId) {
        console.log("ParticipantsList - Setting selected draw ID to:", sharedDrawId);
        // Use enhanced refetch that accepts a draw ID override
        enhancedRefetchParticipants(sharedDrawId);
      }
    }
  }, [sharedDrawId, selectedDrawId, enhancedRefetchParticipants]);
  
  // Reset page when draw changes and refetch participants data for the new draw ID
  useEffect(() => {
    console.log("Draw ID changed in ParticipantsList:", selectedDrawId);
    console.log("Current participants data:", drawParticipants);
    
    // Reset to first page when draws change
    setCurrentPage(1);
    
    // Force refetch participants when draw ID changes
    if (selectedDrawId !== undefined) {
      console.log("ParticipantsList - Explicitly refetching participants for draw ID:", selectedDrawId);
      // Use the enhanced refetch that accepts a draw ID parameter
      enhancedRefetchParticipants(selectedDrawId);
    }
  }, [selectedDrawId, enhancedRefetchParticipants]);
  
  // Additional effect to watch for shared draw ID changes
  useEffect(() => {
    // Force data refetch when the shared draw ID changes, even if selectedDrawId hasn't updated yet
    if (sharedDrawId !== undefined && sharedDrawId !== selectedDrawId) {
      console.log("ParticipantsList - Forcing refetch for shared draw ID:", sharedDrawId);
      // Use enhanced refetch function that overrides the draw ID parameter
      enhancedRefetchParticipants(sharedDrawId);
    }
  }, [sharedDrawId, selectedDrawId, enhancedRefetchParticipants]);
  
  // Get the selected draw ticket price for value calculation
  const ticketPrice = getSelectedDrawTicketPrice();
  
  // If we have draw-specific participants data, use it, otherwise use empty array
  const displayParticipants = isDrawAvailable() 
    ? (Array.isArray(drawParticipants) ? drawParticipants : [])
    : [];
    
  // For debugging - log participants data structure
  useEffect(() => {
    if (displayParticipants.length > 0) {
      console.log("Participant data example:", displayParticipants[0]);
    }
  }, [displayParticipants]);
    
  // Safe access to participantCount with fallback
  const participantCount = isDrawAvailable() && lotteryData 
    ? (lotteryData.participantCount || displayParticipants.length)
    : 0;
  
  const getTimeDifference = (date: any) => {
    // Ensure date is a proper Date object
    if (!date) return "Unknown time";
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return "Unknown time";
    }
    
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    }
  };
  
  const handlePageSizeChange = (value: string) => {
    setPageSize(value);
    setCurrentPage(1); // Reset to first page when changing page size
  };
  
  const pageCount = Math.ceil(participantCount / parseInt(pageSize));
  const visibleParticipants = displayParticipants.slice(
    (currentPage - 1) * parseInt(pageSize),
    currentPage * parseInt(pageSize)
  );
  
  return (
    <section className="mb-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Participants</h2>
        {isDrawAvailable() && participantCount > 0 && (
          <div className="flex items-center text-sm">
            <span className="text-gray-600 mr-2">Showing</span>
            <Select value={pageSize} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[70px] glass border border-gray-200 rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-gray-600 ml-2">of {participantCount}</span>
          </div>
        )}
      </div>
      
      {!isDrawAvailable() ? (
        <Alert variant="default" className="bg-yellow-50 border-yellow-200 text-yellow-800 mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            No active lottery draws available. Participant data will appear when a new draw is started.
          </AlertDescription>
        </Alert>
      ) : null}
        
      <div className="glass rounded-2xl shadow-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100 bg-opacity-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TX</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {visibleParticipants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {isLoadingDrawParticipants ? 'Loading participants...' : 'No participants found for this draw'}
                  </td>
                </tr>
              ) : (
                visibleParticipants.map((participant, index) => {
                  // Calculate ticket value based on the ticket price for this draw
                  const ticketValue = parseFloat(ticketPrice) * participant.ticketCount;
                  // Format the value with proper handling for very small values
                  const formattedValue = ticketValue < 0.00001 
                    ? ticketValue.toExponential(4) 
                    : ticketValue.toFixed(6);
                  
                  return (
                    <tr key={`${participant.walletAddress}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500">
                        {(currentPage - 1) * parseInt(pageSize) + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                        <a 
                          href={`https://sepolia.etherscan.io/address/${participant.walletAddress}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-accent transition"
                        >
                          {formatAddress(participant.walletAddress)}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                        {participant.ticketCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                        {formattedValue} ETH
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {participant.timestamp ? getTimeDifference(participant.timestamp) : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {participant.transactionHash ? (
                          <a 
                            href={`https://sepolia.etherscan.io/tx/${participant.transactionHash}`}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-gray-400 hover:text-primary transition"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {participantCount > 0 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
                disabled={currentPage === pageCount}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * parseInt(pageSize) + 1}</span> to <span className="font-medium">{Math.min(currentPage * parseInt(pageSize), participantCount)}</span> of <span className="font-medium">{participantCount}</span> participants
                </p>
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
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
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink onClick={() => setCurrentPage(pageCount)}>
                          {pageCount}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
                      className={currentPage === pageCount ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
