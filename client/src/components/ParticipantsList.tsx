import React, { useState } from 'react';
import { useLotteryData } from '@/hooks/useLotteryData';
import { formatAddress } from '@/lib/web3';
import { ExternalLink } from 'lucide-react';
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

export default function ParticipantsList() {
  const { currentLottery, participants, isLoadingParticipants, formatUSD } = useLotteryData();
  const [pageSize, setPageSize] = useState<string>("10");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Default participant data if API doesn't return any
  const defaultParticipants = [
    { id: 1, walletAddress: "0x71C7656E976F", ticketCount: 5, purchaseTime: new Date(Date.now() - 2 * 60 * 60 * 1000), transactionHash: "0xabc123" },
    { id: 2, walletAddress: "0x3A54F4F3312E", ticketCount: 10, purchaseTime: new Date(Date.now() - 3 * 60 * 60 * 1000), transactionHash: "0xdef456" },
    { id: 3, walletAddress: "0x8B4ABD7F776A", ticketCount: 2, purchaseTime: new Date(Date.now() - 5 * 60 * 60 * 1000), transactionHash: "0xghi789" },
    { id: 4, walletAddress: "0x5C4E7F8D664C", ticketCount: 3, purchaseTime: new Date(Date.now() - 7 * 60 * 60 * 1000), transactionHash: "0xjkl012" },
    { id: 5, walletAddress: "0x2A1B3C4D887D", ticketCount: 15, purchaseTime: new Date(Date.now() - 10 * 60 * 60 * 1000), transactionHash: "0xmno345" }
  ];
  
  // If we have participants data from the API, use it, otherwise use the default data
  const displayParticipants = Array.isArray(participants) ? participants : defaultParticipants;
  const participantCount = currentLottery?.participantCount || displayParticipants.length;
  
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
      </div>
      
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
              {visibleParticipants.map((participant, index) => (
                <tr key={participant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500">
                    {(currentPage - 1) * parseInt(pageSize) + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                    <a 
                      href={`https://etherscan.io/address/${participant.walletAddress}`} 
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
                    {(parseFloat('0.01') * participant.ticketCount).toFixed(2)} ETH
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getTimeDifference(participant.purchaseTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <a 
                      href={`https://etherscan.io/tx/${participant.transactionHash}`}
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
      </div>
    </section>
  );
}
