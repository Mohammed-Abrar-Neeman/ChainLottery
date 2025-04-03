import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import WalletModal from '@/components/modals/WalletModal';
import { formatAddress, formatEther } from '@/lib/web3';
import { ExternalLink, Ticket, AlertTriangle, Wallet, ChevronDown, RefreshCw } from 'lucide-react';
import { useLotteryData } from '@/hooks/useLotteryData';
import { getAllUserTicketDetails, UserTicket } from '@/lib/lotteryContract';

// Version of this component file: 2.0.0 - Complete rewrite of ticket refresh functionality

export default function MyTickets() {
  const { account, isConnected, provider } = useWallet();
  const { 
    formatUSD, 
    seriesList, 
    isLoadingSeriesList,
    totalDrawsCount,
    seriesDraws,
    isLoadingSeriesDraws,
    selectedSeriesIndex,
    selectedDrawId,
    setSelectedSeriesIndex,
    setSelectedDrawId
  } = useLotteryData();
  
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [userTickets, setUserTickets] = useState<UserTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketsError, setTicketsError] = useState<Error | null>(null);
  
  // Format the date
  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(new Date(timestamp));
  };
  
  // Helper to check if there are draws available for a series
  const hasDrawsForSeries = (seriesIndex: number): boolean => {
    if (!seriesDraws || seriesDraws.length === 0) {
      return false;
    }
    
    // Check if any draws match the specified series index
    return seriesDraws.some(draw => draw.seriesIndex === seriesIndex);
  };
  
  // Initialize series selection when seriesList loads - if not already set
  useEffect(() => {
    if (seriesList && seriesList.length > 0 && selectedSeriesIndex === undefined) {
      // Select the first active series by default
      const activeSeries = seriesList.find(series => series.active);
      if (activeSeries) {
        console.log("Setting lottery data series to active series:", activeSeries.index);
        setSelectedSeriesIndex(activeSeries.index);
      } else if (seriesList.length > 0) {
        console.log("No active series, setting lottery data series to first series:", seriesList[0].index);
        setSelectedSeriesIndex(seriesList[0].index);
      }
    }
  }, [seriesList, selectedSeriesIndex, setSelectedSeriesIndex]);
  
  // Initialize draw selection when series changes
  useEffect(() => {
    if (selectedSeriesIndex !== undefined && Array.isArray(seriesDraws) && seriesDraws.length > 0) {
      console.log("Draw initialization - Series index changed:", selectedSeriesIndex);
      console.log("Draw initialization - Available draws:", seriesDraws);
      
      // Filter draws for the selected series
      const drawsForSeries = seriesDraws.filter(draw => draw.seriesIndex === selectedSeriesIndex);
      console.log("Draw initialization - Draws for this series:", drawsForSeries);
      
      if (drawsForSeries.length > 0) {
        // Find the most recent active draw by default
        const sortedDraws = [...drawsForSeries].sort((a, b) => b.drawId - a.drawId);
        const selectedDraw = sortedDraws[0];
        console.log("Draw initialization - Selected draw:", selectedDraw);
        setSelectedDrawId(selectedDraw.drawId); // Use the global state setter
      } else {
        console.log("Draw initialization - No draws found for series", selectedSeriesIndex);
        setSelectedDrawId(undefined); // Reset draw ID when changing to a series with no draws
      }
    }
  }, [selectedSeriesIndex, seriesDraws, setSelectedDrawId]);
  
  // Load user tickets when all required data is available
  useEffect(() => {
    const fetchUserTickets = async () => {
      if (!isConnected || !account || !provider) {
        return;
      }
      
      if (selectedSeriesIndex === undefined || selectedDrawId === undefined) {
        return;
      }
      
      try {
        setIsLoadingTickets(true);
        setTicketsError(null);
        
        console.log(`Fetching tickets for user ${account} in series ${selectedSeriesIndex}, draw ${selectedDrawId}`);
        
        // Fetch tickets from blockchain
        const tickets = await getAllUserTicketDetails(
          account,
          selectedSeriesIndex,
          selectedDrawId,
          provider
        );
        
        console.log(`Found ${tickets.length} tickets for user ${account}`, tickets);
        
        setUserTickets(tickets);
      } catch (error) {
        console.error("Error fetching user tickets:", error);
        setTicketsError(error as Error);
      } finally {
        setIsLoadingTickets(false);
      }
    };
    
    fetchUserTickets();
  }, [account, isConnected, provider, selectedSeriesIndex, selectedDrawId]);
  
  const handleRefreshTickets = async () => {
    console.log("Refresh Tickets clicked");
    
    // Set loading state
    setUserTickets([]);
    setIsLoadingTickets(true);
    setTicketsError(null);
    
    // Input validation
    if (!isConnected || !account || !provider) {
      console.error("Refresh tickets failed: Wallet not connected properly");
      setTicketsError(new Error("Please make sure your wallet is connected properly"));
      setIsLoadingTickets(false);
      return;
    }
    
    if (selectedSeriesIndex === undefined) {
      console.error("Refresh tickets failed: No series selected");
      setTicketsError(new Error("Please select a series first"));
      setIsLoadingTickets(false);
      return;
    }
    
    if (selectedDrawId === undefined) {
      console.error("Refresh tickets failed: No draw selected");
      setTicketsError(new Error("Please select a draw first"));
      setIsLoadingTickets(false);
      return;
    }
    
    console.log("Input validation passed, fetching tickets with params:", {
      account,
      seriesIndex: selectedSeriesIndex,
      drawId: selectedDrawId,
      provider: provider ? "Provider available" : "No provider"
    });
    
    try {
      console.log(`Refreshing tickets for user ${account} in series ${selectedSeriesIndex}, draw ${selectedDrawId}`);
      
      // Fetch tickets from blockchain with a timeout to ensure we don't hang forever
      const timeoutPromise = new Promise<UserTicket[]>((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out after 15 seconds")), 15000);
      });
      
      const fetchPromise = getAllUserTicketDetails(
        account,
        selectedSeriesIndex,
        selectedDrawId,
        provider
      );
      
      // Use Promise.race to handle potential timeouts
      const tickets = await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log(`Found ${tickets.length} tickets`, tickets);
      setUserTickets(tickets);
      
      // If we found no tickets, give the user specific feedback
      if (tickets.length === 0) {
        setTicketsError(new Error(`No tickets found for Draw #${selectedDrawId} in Series ${selectedSeriesIndex}`));
      }
    } catch (error) {
      console.error("Error fetching user tickets:", error);
      setTicketsError(error as Error);
    } finally {
      setIsLoadingTickets(false);
    }
  };
  
  // If not connected, show connect wallet prompt
  if (!isConnected) {
    return (
      <div className="mt-10 flex flex-col items-center text-center">
        <div className="bg-gray-100 rounded-full p-4 mb-4">
          <Wallet className="h-10 w-10 text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
        <p className="text-gray-600 mb-6 max-w-md">
          Connect your wallet to view your lottery tickets and transaction history.
        </p>
        <Button 
          onClick={() => setShowWalletModal(true)}
          className="bg-primary hover:bg-opacity-90 text-white font-semibold rounded-full px-8 py-3 transition"
        >
          Connect Wallet
        </Button>
        <WalletModal open={showWalletModal} onClose={() => setShowWalletModal(false)} />
      </div>
    );
  }
  
  return (
    <div className="mt-8">
      <h1 className="text-2xl font-bold mb-6">My Lottery Tickets</h1>
      
      {/* Connected Wallet Card */}
      <div className="glass rounded-2xl shadow-glass p-6 mb-8">
        <div className="flex items-center mb-4">
          <div className="h-10 w-10 rounded-full bg-primary bg-opacity-20 flex items-center justify-center text-primary mr-3">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Connected Wallet</h2>
            <p className="font-mono text-sm text-gray-600">{account ? formatAddress(account) : ''}</p>
          </div>
        </div>
        
        {/* Selection Controls - Matching the HeroBanner implementation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div>
            <Label htmlFor="series-select" className="text-sm font-medium mb-2 block">Series</Label>
            <Select
              disabled={isLoadingSeriesList || !seriesList || seriesList.length === 0}
              value={selectedSeriesIndex?.toString() || ""}
              onValueChange={(value) => {
                const numValue = Number(value);
                console.log("MyTickets - Series change:", { 
                  oldValue: selectedSeriesIndex, 
                  newValue: numValue 
                });
                
                // Update the series index
                setSelectedSeriesIndex(numValue);
                
                // Reset draw selection when series changes
                setSelectedDrawId(undefined);
                
                // Clear any tickets when changing series for a clean slate
                setUserTickets([]);
              }}
            >
              <SelectTrigger id="series-select" className="w-full">
                <SelectValue placeholder="Select series" />
              </SelectTrigger>
              <SelectContent>
                {seriesList?.map((series) => (
                  <SelectItem key={series.index} value={series.index.toString()}>
                    Series {series.index}: {series.name} {series.active ? ' (Active)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="draw-select" className="text-sm font-medium mb-2 block">Draw</Label>
            <Select
              disabled={
                isLoadingSeriesDraws || 
                selectedSeriesIndex === undefined || 
                !seriesDraws || 
                seriesDraws.length === 0
              }
              value={selectedDrawId?.toString() || ""}
              onValueChange={(value) => {
                const numValue = Number(value);
                console.log("MyTickets - Draw change:", { 
                  oldValue: selectedDrawId, 
                  newValue: numValue 
                });
                
                // Force update the draw ID with direct state management
                setSelectedDrawId(numValue);
                
                // Clear any tickets when changing draws for a clean slate
                setUserTickets([]);
                
                // Force input validation to run with the new drawId
                if (isConnected && account && provider && selectedSeriesIndex !== undefined) {
                  console.log("Auto-triggering ticket refresh for new draw selection:", numValue);
                  // Set a slight delay to ensure state updates first
                  setTimeout(() => {
                    handleRefreshTickets();
                  }, 500);
                }
              }}
            >
              <SelectTrigger id="draw-select" className="w-full">
                <SelectValue placeholder={
                  selectedSeriesIndex === undefined 
                    ? "Select a series first" 
                    : !hasDrawsForSeries(selectedSeriesIndex)
                    ? "No draws available" 
                    : "Select draw"
                } />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  // If no series is selected or we're loading data
                  if (selectedSeriesIndex === undefined || !seriesDraws) {
                    return <SelectItem disabled value="-1">Select a series first</SelectItem>;
                  }
                  
                  // Filter draws for the selected series
                  const filteredDraws = seriesDraws.filter(draw => 
                    draw.seriesIndex === selectedSeriesIndex
                  );
                  
                  console.log("MyTickets - filtered draws for series", selectedSeriesIndex, ":", filteredDraws);
                  
                  // If no draws found for this series
                  if (filteredDraws.length === 0) {
                    return <SelectItem disabled value="-1">No draws in this series</SelectItem>;
                  }
                  
                  // Debug the raw filtered draws
                  console.log("MyTickets - raw draws before sorting:", JSON.stringify(filteredDraws));
                  
                  // Create a copy to avoid modifying the original array during sort
                  // Force Draw #1 to the first position regardless of sorting
                  const draw1 = filteredDraws.find(draw => draw.drawId === 1);
                  const otherDraws = filteredDraws.filter(draw => draw.drawId !== 1);
                  
                  // Sort other draws in ascending order
                  otherDraws.sort((a, b) => a.drawId - b.drawId);
                  
                  // Combine with Draw #1 first if it exists
                  const sortedDraws = draw1 ? [draw1, ...otherDraws] : otherDraws;
                  
                  console.log("MyTickets - manually sorted draws:", JSON.stringify(sortedDraws));
                  
                  // Map the sorted draws to select items
                  return sortedDraws.map((draw) => {
                    console.log("MyTickets - Creating select item for draw:", draw.drawId, draw);
                    
                    return (
                      <SelectItem key={draw.drawId} value={draw.drawId.toString()}>
                        Draw #{draw.drawId} {!draw.completed ? ' (Active)' : ' (Completed)'}
                      </SelectItem>
                    );
                  });
                })()}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={handleRefreshTickets}
            disabled={isLoadingTickets}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Tickets
          </Button>
        </div>
        
        {/* Tickets Count Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Total Tickets</div>
            <div className="text-2xl font-bold font-mono">
              {userTickets.length}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Active Tickets</div>
            <div className="text-2xl font-bold font-mono">
              {seriesDraws && selectedDrawId ? 
                (seriesDraws.find(d => d.drawId === selectedDrawId)?.completed ? 0 : userTickets.length) : 0}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Winning Tickets</div>
            <div className="text-2xl font-bold font-mono">
              {userTickets.filter(ticket => ticket.isWinner).length}
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading State */}
      {isLoadingTickets && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Loading your tickets...</p>
        </div>
      )}
      
      {/* Error State */}
      {ticketsError && !isLoadingTickets && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error loading tickets</p>
            <p className="text-sm text-red-600">{ticketsError.message}</p>
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {!isLoadingTickets && userTickets.length === 0 && (
        <div className="text-center py-10 border border-gray-200 rounded-lg bg-gray-50">
          <Ticket className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-800 mb-1">No Tickets Found</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            {selectedSeriesIndex !== undefined && selectedDrawId !== undefined ? 
              `You haven't purchased any tickets for Draw #${selectedDrawId} in Series ${selectedSeriesIndex}.` : 
              'Select a series and draw to view your tickets.'}
          </p>
          <Button 
            asChild
            variant="outline"
            className="rounded-full"
          >
            <a href="/#buy-tickets">Buy Tickets</a>
          </Button>
        </div>
      )}
      
      {/* Tickets List */}
      {!isLoadingTickets && userTickets.length > 0 && (
        <div className="mt-4 space-y-4">
          <h2 className="font-bold text-xl">Your Tickets</h2>
          
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numbers
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Purchased
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userTickets.map((ticket) => (
                  <tr key={`${ticket.seriesIndex}-${ticket.drawId}-${ticket.ticketIndex}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{ticket.ticketIndex}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="flex space-x-1">
                          {ticket.numbers.map((num, idx) => (
                            <span 
                              key={idx}
                              className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-xs font-medium"
                            >
                              {num.toString().padStart(2, '0')}
                            </span>
                          ))}
                        </div>
                        <span className="mx-2 text-gray-400">+</span>
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
                          {ticket.lottoNumber.toString().padStart(2, '0')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ticket.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {seriesDraws && seriesDraws.find(d => d.drawId === ticket.drawId && d.seriesIndex === ticket.seriesIndex)?.completed ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Completed
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ticket.isWinner ? (
                        <div>
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 mb-1">
                            Winner
                          </span>
                          <div className="text-xs text-green-600 font-medium">
                            {formatEther(ticket.amountWon)} ETH
                          </div>
                        </div>
                      ) : seriesDraws && seriesDraws.find(d => d.drawId === ticket.drawId && d.seriesIndex === ticket.seriesIndex)?.completed ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          No Win
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}