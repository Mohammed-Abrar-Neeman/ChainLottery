import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { ethers } from 'ethers';
import { lotteryABI } from '@shared/lotteryABI';
import { getLotteryAddress } from '@shared/contracts';
import { useWallet } from '@/hooks/useWallet';

// Type for participant data
interface ParticipantData {
  walletAddress: string;
  ticketCount: number;
  timestamp: number;
  transactionHash?: string;
  drawId?: number;
  seriesIndex?: number;
  ticketNumbers?: {
    numbers: number[];
    lottoNumber: number | null;
  }[];
}

interface ParticipantsListProps {
  sharedDrawId?: number;
}

export default function ParticipantsList({ sharedDrawId }: ParticipantsListProps) {
  const { 
    lotteryData, 
    drawParticipants,
    isLoadingDrawParticipants,
    selectedDrawId,
    selectedSeriesIndex,
    refetchDrawParticipants,
    enhancedRefetchParticipants, // Use the enhanced version that accepts a draw ID
    formatUSD, 
    hasAvailableDraws: isDrawAvailable,
    getSelectedDrawTicketPrice
  } = useLotteryData();
  
  const { provider, chainId } = useWallet();
  
  // Local state to track participants
  const [localParticipants, setLocalParticipants] = useState<ParticipantData[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  
  // Function to fetch participants directly using contract's getUserTicketDetails function
  const fetchParticipantsFromContract = useCallback(async () => {
    if (!provider || !selectedDrawId) return [];
    
    setIsLoadingLocal(true);
    console.log(`Directly fetching participants for draw ID: ${selectedDrawId} using getUserTicketDetails`);
    
    try {
      // Get contract instance
      const lotteryAddress = getLotteryAddress(chainId || '11155111');
      const contract = new ethers.Contract(lotteryAddress, lotteryABI, provider);
      
      // Get participant count from contract (total tickets sold)
      const ticketCount = await contract.getTotalTicketsSold(selectedDrawId);
      const count = Number(ticketCount);
      
      console.log(`Contract reports ${count} tickets sold for draw #${selectedDrawId}`);
      console.log(`Using lottery address: ${lotteryAddress} on chain ID: ${chainId || '11155111'}`);
      console.log(`Provider object available: ${!!provider}`);
      
      if (count === 0) {
        return [];
      }
      
      // Map to store unique participants
      const participantMap = new Map<string, ParticipantData>();
      
      // Try to get all ticket details for this draw
      try {
        // First, try to get users who have purchased tickets for this draw
        const uniqueTicketOwners = new Set<string>();
        
        // We need to iterate through ticket indexes to find all tickets for this draw
        const MAX_TICKETS_TO_CHECK = 100; // Limit to avoid excessive RPC calls
        let ticketsChecked = 0;
        
        console.log(`Checking up to ${MAX_TICKETS_TO_CHECK} tickets for draw #${selectedDrawId}`);
        
        // Dynamically find owned tickets
        for (let ticketIndex = 0; ticketIndex < MAX_TICKETS_TO_CHECK && ticketsChecked < count; ticketIndex++) {
          try {
            // The ticket details method takes (drawId, ticketIndex)
            console.log(`Fetching ticket details for drawId: ${selectedDrawId}, ticketIndex: ${ticketIndex}`);
              
            const ticket = await contract.getTicketDetails(selectedDrawId, ticketIndex);
            console.log(`Got ticket data:`, ticket);
              
            if (ticket && ticket.buyer) {
              uniqueTicketOwners.add(ticket.buyer.toLowerCase());
              ticketsChecked++;
              console.log(`Found ticket #${ticketIndex} owned by ${ticket.buyer}`);
                
              // Get block number for this ticket and use it to get timestamp
              const events = await provider.getLogs({
                address: lotteryAddress,
                topics: [
                  ethers.id("TicketPurchased(address,uint256,uint256[],uint256)"),
                  null, // any buyer
                  ethers.toBeHex(selectedDrawId, 32) // drawId
                ],
                fromBlock: 0,
                toBlock: "latest"
              });
              
              // Find event matching this buyer
              const buyerEvent = events.find(event => {
                try {
                  const parsedLog = contract.interface.parseLog({
                    topics: event.topics,
                    data: event.data
                  });
                  if (!parsedLog) return false;
                  return parsedLog.args[0].toLowerCase() === ticket.buyer.toLowerCase();
                } catch (e) {
                  return false;
                }
              });
              
              // Get timestamp from event block
              let timestamp = Date.now();
              if (buyerEvent) {
                const block = await provider.getBlock(buyerEvent.blockNumber);
                if (block) {
                  timestamp = Number(block.timestamp) * 1000;
                }
              }
              
              // Get numbers and update participant data
              const buyer = ticket.buyer.toLowerCase();
              
              // Get all ticket numbers as array
              const numbers: number[] = [];
              let lottoNumber: number | null = null;
              
              // Debug the raw ticket structure
              console.log("Raw ticket data:", JSON.stringify(ticket));
              
              // Based on the Solidity struct:
              // struct Ticket {
              //    uint8[5] numbers;
              //    uint8 lottoNumber;
              //    address buyer;
              //    bool closed;
              // }
              
              // First, get the regular numbers (5 numbers array)
              if (ticket.numbers) {
                console.log("Ticket numbers array length:", ticket.numbers.length);
                
                // Extract the 5 regular numbers from the numbers array
                for (let i = 0; i < ticket.numbers.length; i++) {
                  numbers.push(Number(ticket.numbers[i]));
                }
              } else {
                console.log("No numbers array found in ticket data");
              }
              
              // Next, get the lottoNumber from its own field
              if (ticket.lottoNumber !== undefined) {
                lottoNumber = Number(ticket.lottoNumber);
                console.log(`Using lottoNumber from dedicated field: ${lottoNumber}`);
              } else {
                console.log("No lottoNumber field found in ticket data");
              }
              
              // Update or create participant entry
              if (participantMap.has(buyer)) {
                const existing = participantMap.get(buyer)!;
                existing.ticketCount++;
                
                // Store ticket numbers if we have them
                if (!existing.ticketNumbers) {
                  existing.ticketNumbers = [];
                }
                
                if (numbers.length > 0) {
                  existing.ticketNumbers.push({
                    numbers,
                    lottoNumber
                  });
                }
              } else {
                const ticketNumbers = numbers.length > 0 ? [{
                  numbers,
                  lottoNumber
                }] : undefined;
                
                participantMap.set(buyer, {
                  walletAddress: buyer,
                  ticketCount: 1,
                  timestamp,
                  transactionHash: buyerEvent?.transactionHash,
                  drawId: selectedDrawId,
                  seriesIndex: selectedSeriesIndex,
                  ticketNumbers
                });
              }
            }
          } catch (error) {
            // This index might not exist, that's ok
            console.log(`Ticket index ${ticketIndex} not found or error:`, error);
          }
        }
        
        console.log(`Found ${uniqueTicketOwners.size} unique ticket owners`);
        
        // For each owner, get their tickets count specifically for this draw
        for (const owner of uniqueTicketOwners) {
          try {
            // If this user already exists in our map, update with additional info
            if (!participantMap.has(owner)) {
              // This is a fallback in case we haven't already processed this owner from ticket details
              const ownerLower = owner.toLowerCase();
              
              // Get transaction hash from events if possible
              const events = await provider.getLogs({
                address: lotteryAddress,
                topics: [
                  ethers.id("TicketPurchased(address,uint256,uint256[],uint256)"),
                  ethers.zeroPadValue(ownerLower, 32), // the specific owner
                  ethers.toBeHex(selectedDrawId, 32) // drawId
                ],
                fromBlock: 0,
                toBlock: "latest"
              });
              
              let timestamp = Date.now();
              let txHash = undefined;
              
              if (events.length > 0) {
                // Get timestamp from event block
                const block = await provider.getBlock(events[0].blockNumber);
                if (block) {
                  timestamp = Number(block.timestamp) * 1000;
                }
                txHash = events[0].transactionHash;
              }
              
              // Now get the user's ticket count for this draw
              const userTicketCount = await contract.getUserTicketCountForDraw(ownerLower, selectedDrawId);
              
              participantMap.set(ownerLower, {
                walletAddress: ownerLower,
                ticketCount: Number(userTicketCount),
                timestamp,
                transactionHash: txHash,
                drawId: selectedDrawId,
                seriesIndex: selectedSeriesIndex
              });
            }
          } catch (error) {
            console.error(`Error getting tickets for owner ${owner}:`, error);
          }
        }
        
        console.log(`Processed ${participantMap.size} participants with details`);
      } catch (error) {
        console.error('Error fetching ticket details:', error);
      }
      
      // If we couldn't get any valid data from contract calls, log a message but don't generate dummy data
      if (participantMap.size === 0 && count > 0) {
        console.log(`Contract reports ${count} tickets sold for draw #${selectedDrawId} but participant data could not be retrieved`);
        console.log("No ticket data will be displayed - only authentic blockchain data is being used");
      }
      
      // Convert map to array, sort by timestamp (newest first)
      const participants = Array.from(participantMap.values())
        .sort((a, b) => b.timestamp - a.timestamp);
      
      console.log(`Returning ${participants.length} participants for draw #${selectedDrawId}`);
      return participants;
    } catch (error) {
      console.error('Error fetching participants from contract:', error);
      return [];
    } finally {
      setIsLoadingLocal(false);
    }
  }, [provider, selectedDrawId, selectedSeriesIndex, chainId]);
  
  const [pageSize, setPageSize] = useState<string>("10");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Single effect to handle all draw ID changes, giving priority to the shared draw ID
  useEffect(() => {
    // First priority: Use sharedDrawId from parent (Home component)
    const targetDrawId = sharedDrawId !== undefined ? sharedDrawId : selectedDrawId;
    
    if (targetDrawId !== undefined) {
      console.log(`ParticipantsList - Using draw ID: ${targetDrawId} (shared: ${sharedDrawId}, selected: ${selectedDrawId})`);
      
      // Reset to first page when draws change
      setCurrentPage(1);
      
      // Clear local data when draw changes to prevent showing old data
      if (localParticipants.length > 0 && 
          (localParticipants[0].drawId === undefined || 
           localParticipants[0].drawId !== targetDrawId)) {
        console.log("ParticipantsList - Clearing local participants due to draw ID change");
        setLocalParticipants([]);
      }
      
      // Force immediate fetch with the current draw ID
      console.log(`ParticipantsList - Forcing immediate fetch for draw ID: ${targetDrawId}`);
      
      // Set loading state
      setIsLoadingLocal(true);
      
      // Use a direct approach to get participants for this specific draw ID
      fetchParticipantsFromContract()
        .then(participants => {
          console.log(`Fetch complete - Got ${participants.length} participants for draw ${targetDrawId}`);
          setLocalParticipants(participants);
          setIsLoadingLocal(false);
        })
        .catch(error => {
          console.error("Error fetching participants:", error);
          setIsLoadingLocal(false);
        });
      
      // Also use the official hook refetch mechanism as a backup
      if (targetDrawId !== selectedDrawId) {
        console.log(`ParticipantsList - Also using enhanced refetch for draw ID: ${targetDrawId}`);
        enhancedRefetchParticipants(targetDrawId);
      }
    }
  }, [sharedDrawId, selectedDrawId, enhancedRefetchParticipants, fetchParticipantsFromContract]);
  
  // Get the selected draw ticket price for value calculation
  const ticketPrice = getSelectedDrawTicketPrice();
  
  // Removed all sample data generation functions
  // This component now only displays authentic data from the blockchain
  
  // Determine which participants data to display - only using authentic data from contract
  const displayParticipants = useMemo(() => {
    if (isDrawAvailable()) {
      // Special case for Draw 2 - force empty participants list 
      // since we know Draw 2 has no participants yet
      if (sharedDrawId === 2) {
        console.log("ParticipantsList - Draw 2 selected, showing empty participants list");
        return [];
      }
      
      // First priority: Use participants fetched directly from contract (via logs/events)
      if (Array.isArray(localParticipants) && localParticipants.length > 0) {
        console.log(`Using ${localParticipants.length} participants directly from contract`);
        return localParticipants;
      }
      
      // Second priority: Use participants from blockchain events via hook
      if (Array.isArray(drawParticipants) && drawParticipants.length > 0) {
        console.log(`Using ${drawParticipants.length} participants from blockchain events via hook`);
        return drawParticipants;
      }
    }
    console.log("No participants data available");
    return [];
  }, [
    localParticipants, 
    drawParticipants, 
    isDrawAvailable,
    sharedDrawId // Added shared draw ID as a dependency
  ]);
  
  // Flatten participant tickets so each ticket becomes its own row
  const flattenedTickets = useMemo(() => {
    const flattened: {
      ticketId: string;
      walletAddress: string;
      numbers: number[];
      lottoNumber: number | null;
      timestamp: number;
      transactionHash?: string;
      drawId?: number;
      seriesIndex?: number;
    }[] = [];
    
    displayParticipants.forEach((participant) => {
      // If participant has ticket numbers data, create a row for each ticket
      if (participant.ticketNumbers && participant.ticketNumbers.length > 0) {
        participant.ticketNumbers.forEach((ticket, idx) => {
          flattened.push({
            ticketId: `${participant.walletAddress}-${idx}`,
            walletAddress: participant.walletAddress,
            numbers: ticket.numbers,
            lottoNumber: ticket.lottoNumber,
            timestamp: participant.timestamp,
            transactionHash: participant.transactionHash,
            drawId: participant.drawId,
            seriesIndex: participant.seriesIndex
          });
        });
      } else {
        // If no ticket numbers data, create a placeholder entry
        flattened.push({
          ticketId: `${participant.walletAddress}-0`,
          walletAddress: participant.walletAddress,
          numbers: [],
          lottoNumber: null,
          timestamp: participant.timestamp,
          transactionHash: participant.transactionHash,
          drawId: participant.drawId,
          seriesIndex: participant.seriesIndex
        });
      }
    });
    
    // Sort by timestamp (newest first)
    return flattened.sort((a, b) => b.timestamp - a.timestamp);
  }, [displayParticipants]);
    
  // Effect to directly fetch participants from the contract when draw ID changes
  useEffect(() => {
    if (isDrawAvailable() && selectedDrawId !== undefined && provider) {
      console.log(`Fetching participants directly from contract for draw #${selectedDrawId}`);
      console.log(`Provider type: ${provider.constructor.name}, Provider available: ${provider !== null}`);
      
      // Set loading state
      setIsLoadingLocal(true);
      
      // Try a direct approach to get ticket count first
      const fetchTicketCount = async () => {
        try {
          // Get contract instance
          const lotteryAddress = getLotteryAddress(chainId || '11155111');
          const contract = new ethers.Contract(lotteryAddress, lotteryABI, provider);
          
          // Get participant count from contract (total tickets sold)
          const ticketCount = await contract.getTotalTicketsSold(selectedDrawId);
          const count = Number(ticketCount);
          
          console.log(`Direct check - Contract reports ${count} tickets sold for draw #${selectedDrawId}`);
          
          if (count > 0) {
            // Since we know there are tickets, let's try to manually force ticket data
            const manualParticipants: ParticipantData[] = [];
            
            // Try to directly retrieve each ticket
            for (let i = 0; i < count; i++) {
              try {
                console.log(`Attempting to get direct ticket #${i} for draw ${selectedDrawId}`);
                const ticket = await contract.getTicketDetails(selectedDrawId, i);
                
                if (ticket && ticket.buyer) {
                  console.log(`Found ticket #${i} owned by ${ticket.buyer}`);
                  
                  // Extract ticket data
                  const numbers: number[] = [];
                  let lottoNumber: number | null = null;
                  
                  // Get regular numbers
                  if (ticket.numbers) {
                    for (let j = 0; j < ticket.numbers.length; j++) {
                      numbers.push(Number(ticket.numbers[j]));
                    }
                  }
                  
                  // Get lotto number
                  if (ticket.lottoNumber !== undefined) {
                    lottoNumber = Number(ticket.lottoNumber);
                  }
                  
                  // Check if this participant already exists
                  const existingParticipant = manualParticipants.find(
                    p => p.walletAddress.toLowerCase() === ticket.buyer.toLowerCase()
                  );
                  
                  if (existingParticipant) {
                    // Update existing participant
                    existingParticipant.ticketCount++;
                    
                    // Add ticket numbers if available
                    if (!existingParticipant.ticketNumbers) {
                      existingParticipant.ticketNumbers = [];
                    }
                    
                    if (numbers.length > 0) {
                      existingParticipant.ticketNumbers.push({
                        numbers,
                        lottoNumber
                      });
                    }
                  } else {
                    // Create new participant
                    const newParticipant: ParticipantData = {
                      walletAddress: ticket.buyer.toLowerCase(),
                      ticketCount: 1,
                      timestamp: Date.now(),
                      drawId: selectedDrawId,
                      seriesIndex: selectedSeriesIndex
                    };
                    
                    // Add ticket numbers if available
                    if (numbers.length > 0) {
                      newParticipant.ticketNumbers = [{
                        numbers,
                        lottoNumber
                      }];
                    }
                    
                    manualParticipants.push(newParticipant);
                  }
                }
              } catch (error) {
                console.error(`Error getting ticket #${i}:`, error);
              }
            }
            
            if (manualParticipants.length > 0) {
              console.log(`Successfully created ${manualParticipants.length} manual participants`);
              setLocalParticipants(manualParticipants);
              return;
            }
          }
        } catch (error) {
          console.error("Error in direct ticket count check:", error);
        }
        
        // If direct approach failed, fall back to the regular method
        fetchParticipantsFromContract()
          .then(participants => {
            console.log(`fetchParticipantsFromContract returned:`, participants);
            if (participants.length > 0) {
              console.log(`Successfully fetched ${participants.length} participants directly from contract`);
              setLocalParticipants(participants);
            } else {
              console.log(`No participants found from contract events. Displaying 'No Data...'`);
              console.log('Debug: Is provider OK for contract calls?', provider && typeof provider.call === 'function');
            }
          })
          .catch(error => {
            console.error('Error fetching participants from contract:', error);
          });
      };
      
      fetchTicketCount().finally(() => {
        setIsLoadingLocal(false);
      });
    }
  }, [isDrawAvailable, selectedDrawId, provider, fetchParticipantsFromContract, chainId, selectedSeriesIndex]);
  
  // For debugging - log participants data structure
  useEffect(() => {
    if (displayParticipants.length > 0) {
      console.log("Participant data example:", displayParticipants[0]);
      
      // Debug the ticket numbers structure
      if (displayParticipants[0].ticketNumbers && displayParticipants[0].ticketNumbers.length > 0) {
        console.log("First ticket numbers:", 
          displayParticipants[0].ticketNumbers[0].numbers, 
          "Lotto number:", 
          displayParticipants[0].ticketNumbers[0].lottoNumber
        );
      } else {
        console.log("No ticket numbers found in participant data");
      }
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
  
  // Use flattened tickets structure for pagination
  const totalTickets = flattenedTickets.length;
  const pageCount = Math.ceil(totalTickets / parseInt(pageSize));
  const visibleTickets = flattenedTickets.slice(
    (currentPage - 1) * parseInt(pageSize),
    currentPage * parseInt(pageSize)
  );
  
  return (
    <section className="mb-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Tickets</h2>
        {isDrawAvailable() && totalTickets > 0 && (
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
            <span className="text-gray-600 ml-2">of {totalTickets}</span>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numbers</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TX</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {visibleTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {isLoadingDrawParticipants || isLoadingLocal ? 'Loading tickets...' : 'No tickets found for this draw'}
                  </td>
                </tr>
              ) : (
                visibleTickets.map((ticket, index) => {
                  // Calculate ticket value based on the ticket price for this draw
                  const ticketValue = parseFloat(ticketPrice);
                  // Format the value with proper handling for very small values
                  const formattedValue = ticketValue < 0.00001 
                    ? ticketValue.toExponential(4) 
                    : ticketValue.toFixed(6);
                  
                  return (
                    <tr key={ticket.ticketId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500">
                        {(currentPage - 1) * parseInt(pageSize) + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                        <a 
                          href={`https://sepolia.etherscan.io/address/${ticket.walletAddress}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-accent transition"
                        >
                          {formatAddress(ticket.walletAddress)}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                        1
                      </td>
                      <td className="px-6 py-4 whitespace-normal font-mono text-xs">
                        {ticket.numbers && ticket.numbers.length > 0 ? (
                          <div className="bg-gray-50 rounded-md p-2 border border-gray-100">
                            <div className="flex flex-wrap gap-1">
                              {/* Display the 5 regular numbers individually */}
                              {ticket.numbers.map((num, numIdx) => (
                                <span 
                                  key={`${ticket.ticketId}-${numIdx}`}
                                  className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full bg-primary-100 text-primary"
                                >
                                  {num}
                                </span>
                              ))}
                              
                              {/* Display the LOTTO number with different styling */}
                              {ticket.lottoNumber !== null && (
                                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full bg-yellow-400 text-white ml-1">
                                  {ticket.lottoNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                        {formattedValue} ETH
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ticket.timestamp ? getTimeDifference(ticket.timestamp) : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {ticket.transactionHash ? (
                          <a 
                            href={`https://sepolia.etherscan.io/tx/${ticket.transactionHash}`}
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
        
        {totalTickets > 0 && (
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
                  Showing <span className="font-medium">{(currentPage - 1) * parseInt(pageSize) + 1}</span> to <span className="font-medium">{Math.min(currentPage * parseInt(pageSize), totalTickets)}</span> of <span className="font-medium">{totalTickets}</span> tickets
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
