import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { useAppSettings } from '@/context/AppSettingsContext';
import { ExternalLink, Ticket, AlertTriangle, Wallet, ChevronDown, RefreshCw, CheckCircle, Calendar } from 'lucide-react';
import WalletModal from '@/components/modals/WalletModal';
import { formatAddress } from '@/lib/web3';
import { useLotteryContract } from '@/hooks/useLotteryContract';
import { useAppKitAccount } from '@reown/appkit/react';
import { ethers } from 'ethers';

interface TicketData {
  ticketIndex: number;
  numbers: number[];
  lottoNumber: number;
  timestamp: number;
  isWinner: boolean;
  prizeAmount: string;
  claimed: boolean;
  drawId: number;
  seriesIndex: number;
}

export default function MyTickets() {
  const { toast } = useToast();
  const { settings } = useAppSettings();
  const { address, isConnected } = useAppKitAccount();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketsError, setTicketsError] = useState<Error | null>(null);
  const [userTickets, setUserTickets] = useState<TicketData[]>([]);
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [drawsList, setDrawsList] = useState<any[]>([]);
  
  // Local state for dropdown values
  const [localSeriesIndex, setLocalSeriesIndex] = useState<number | undefined>(undefined);
  const [localDrawId, setLocalDrawId] = useState<number | undefined>(undefined);

  const {
    getSeriesList,
    getSeriesDraws,
    getUserTickets,
    checkUserPrizes,
    getContract,
    checkIsAdmin
  } = useLotteryContract();

  // Format the date
  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(new Date(timestamp * 1000));
  };

  // Load series list
  const loadSeriesList = useCallback(async () => {
    try {
      const series = await getSeriesList();
      setSeriesList(series);
      if (series.length > 0) {
        setLocalSeriesIndex(0);
      }
    } catch (error) {
      console.error('Error loading series:', error);
      toast({
        title: "Error",
        description: "Failed to load lottery series",
        variant: "destructive"
      });
    }
  }, [getSeriesList, toast]);

  // Load draws for selected series
  const loadDraws = useCallback(async (seriesIndex: number) => {
    try {
      const draws = await getSeriesDraws(seriesIndex);
      setDrawsList(draws);
      if (draws.length > 0) {
        setLocalDrawId(draws[0].drawId);
      }
    } catch (error) {
      console.error('Error loading draws:', error);
      toast({
        title: "Error",
        description: "Failed to load draws",
        variant: "destructive"
      });
    }
  }, [getSeriesDraws, toast]);

  // Load user tickets
  const loadUserTickets = useCallback(async (drawId: number) => {
    if (!address || !drawId) return;
    
    setIsLoadingTickets(true);
    setTicketsError(null);
    
    try {
      const ticketIndexes = await getUserTickets(drawId);
      const tickets: TicketData[] = [];
      
      for (const ticketIndex of ticketIndexes) {
        const contract = await getContract();
        if (!contract) continue;
        
        const ticket = await contract.getTicketDetails(drawId, ticketIndex);
        const prizeAmount = await checkUserPrizes(drawId, ticketIndex);
        
        tickets.push({
          ticketIndex: Number(ticketIndex),
          numbers: ticket.numbers.map((n: any) => Number(n)),
          lottoNumber: Number(ticket.lottoNumber),
          timestamp: Number(ticket.buyTime),
          isWinner: Number(prizeAmount) > 0,
          prizeAmount,
          claimed: ticket.closed,
          drawId,
          seriesIndex: localSeriesIndex || 0
        });
      }
      
      setUserTickets(tickets);
    } catch (error: any) {
      console.error('Error loading tickets:', error);
      setTicketsError(error);
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive"
      });
    } finally {
      setIsLoadingTickets(false);
    }
  }, [address, getUserTickets, getContract, checkUserPrizes, localSeriesIndex, toast]);

  // Handle series change
  useEffect(() => {
    if (localSeriesIndex !== undefined) {
      loadDraws(localSeriesIndex);
    }
  }, [localSeriesIndex, loadDraws]);

  // Handle draw change
  useEffect(() => {
    if (localDrawId !== undefined) {
      loadUserTickets(localDrawId);
    }
  }, [localDrawId, loadUserTickets]);

  // Initial load
  useEffect(() => {
    if (isConnected) {
      loadSeriesList();
    }
  }, [isConnected, loadSeriesList]);

  // If not connected, show connect wallet prompt
  if (!isConnected) {
    return (
      <div className="mt-10 flex flex-col items-center text-center">
        <div className="bg-black/30 border border-primary/30 rounded-full p-4 mb-4">
          <Wallet className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-amber-500 text-transparent bg-clip-text">Connect Your Wallet</h1>
        <p className="text-white/80 mb-6 max-w-md">
          Connect your wallet to view your lottery tickets and transaction history.
        </p>
        <Button 
          onClick={() => setShowWalletModal(true)}
          className="bg-primary hover:bg-amber-500 text-black font-semibold rounded-full px-8 py-3 transition shadow-gold"
        >
          Connect Wallet
        </Button>
        <WalletModal open={showWalletModal} onClose={() => setShowWalletModal(false)} />
      </div>
    );
  }

  // Handle claim prize
  const handleClaimPrize = async (drawId: number, ticketIndex: number) => {
    try {
      const contract = await getContract();
      if (!contract) return;

      const tx = await contract.claimPrize(drawId, ticketIndex);
      await tx.wait();

      toast({
        title: "Success",
        description: "Prize claimed successfully",
      });

      // Reload tickets
      loadUserTickets(drawId);
    } catch (error: any) {
      console.error('Error claiming prize:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to claim prize",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="mt-8">
      <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-amber-500 text-transparent bg-clip-text">My Lottery Tickets</h1>
      
      {/* Connected Wallet Card */}
      <div className="casino-card p-6 mb-8 pt-12 mt-6">
        <div className="casino-card-header flex justify-between items-center absolute inset-x-0 top-0 px-6 py-4 bg-black/40 border-b border-primary/20 rounded-t-xl">
          <div className="text-sm uppercase tracking-widest font-bold text-primary">
            Wallet
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-white/70">Connected</span>
          </div>
        </div>
        
        {/* Selection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          {settings.showSeriesDropdown && (
            <div>
              <Label htmlFor="series-select" className="text-sm font-bold mb-2 block text-primary uppercase tracking-wider">Series</Label>
              <Select
                value={localSeriesIndex?.toString()}
                onValueChange={(value) => {
                  setLocalSeriesIndex(Number(value));
                  setLocalDrawId(undefined);
                }}
              >
                <SelectTrigger id="series-select" className="w-full bg-black/30 border-primary/20 text-white">
                  <SelectValue placeholder="Select series" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-primary/20">
                  {seriesList.map((series) => (
                    <SelectItem key={series.index} value={series.index.toString()}>
                      {series.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className={settings.showSeriesDropdown ? "" : "md:col-span-2"}>
            <Label htmlFor="draw-select" className="text-sm font-bold mb-2 block text-primary uppercase tracking-wider">
              {settings.showSeriesDropdown ? "Draw" : "Current Draw"}
            </Label>
            <Select
              value={localDrawId?.toString()}
              onValueChange={(value) => setLocalDrawId(Number(value))}
            >
              <SelectTrigger id="draw-select" className="w-full bg-black/30 border-primary/20 text-white">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-primary/70" />
                  <SelectValue placeholder="Select draw" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-primary/20">
                {drawsList.map((draw) => (
                  <SelectItem key={draw.drawId} value={draw.drawId.toString()}>
                    Draw #{draw.drawId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => localDrawId && loadUserTickets(localDrawId)}
            disabled={isLoadingTickets}
            className="flex items-center border-primary/30 text-primary hover:bg-primary/10 hover:border-primary transition-all"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingTickets ? 'animate-spin' : ''}`} />
            Refresh Tickets
          </Button>
        </div>
        
        {/* Tickets Count Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-black/30 border border-primary/20 rounded-lg p-4">
            <div className="text-sm text-primary/80 mb-1 uppercase tracking-wider font-medium">Total Tickets</div>
            <div className="text-2xl font-bold font-mono text-white">
              {userTickets.length}
            </div>
          </div>
          <div className="bg-black/30 border border-primary/20 rounded-lg p-4">
            <div className="text-sm text-primary/80 mb-1 uppercase tracking-wider font-medium">Active Tickets</div>
            <div className="text-2xl font-bold font-mono text-white">
              {userTickets.filter(ticket => !ticket.claimed).length}
            </div>
          </div>
          <div className="bg-black/30 border border-primary/20 rounded-lg p-4">
            <div className="text-sm text-primary/80 mb-1 uppercase tracking-wider font-medium">Winning Tickets</div>
            <div className="text-2xl font-bold font-mono text-white">
              {userTickets.filter(ticket => ticket.isWinner).length}
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading State */}
      {isLoadingTickets && (
        <div className="text-center py-10 casino-card">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-white/80">Loading your tickets...</p>
        </div>
      )}
      
      {/* Error State */}
      {ticketsError && !isLoadingTickets && (
        <div className="bg-red-900/20 border border-red-600/30 text-red-500 px-6 py-4 rounded-lg mb-6 flex items-start casino-card">
          <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-white">Error Loading Tickets</p>
            <p className="text-sm text-red-400/90">{ticketsError.message}</p>
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {!isLoadingTickets && userTickets.length === 0 && (
        <div className="text-center py-10 casino-card">
          <div className="rounded-full mx-auto h-16 w-16 bg-black/30 border border-primary/30 flex items-center justify-center mb-4">
            <Ticket className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-medium text-primary mb-2">No Tickets Found</h3>
          <p className="text-white/80 max-w-md mx-auto mb-6">
            Select a series and draw to view your tickets.
          </p>
          <Button 
            asChild
            variant="outline"
            className="rounded-full border-primary/50 text-primary hover:bg-primary/10 hover:border-primary"
          >
            <a href="/#buy-tickets">Buy Tickets</a>
          </Button>
        </div>
      )}
      
      {/* Tickets List */}
      {!isLoadingTickets && userTickets.length > 0 && (
        <div className="mt-4 space-y-4">
          <h2 className="font-bold text-xl bg-gradient-to-r from-primary to-amber-500 text-transparent bg-clip-text">Your Lottery Tickets</h2>
          
          <div className="casino-card pt-12 mt-6">
            <div className="casino-card-header flex justify-between items-center absolute inset-x-0 top-0 px-6 py-4 bg-black/40 border-b border-primary/20 rounded-t-xl">
              <div className="text-sm uppercase tracking-widest font-bold text-primary">
                Ticket History
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-white/70">Draw #{localDrawId}</span>
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"></span>
              </div>
            </div>
            
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full divide-y divide-primary/10">
                <thead className="bg-black/40">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">
                      Ticket ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">
                      Numbers
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">
                      Date Purchased
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">
                      Prize
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {userTickets.map((ticket) => (
                    <tr key={`${ticket.seriesIndex}-${ticket.drawId}-${ticket.ticketIndex}`} className="bg-black/20 hover:bg-black/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        #{ticket.ticketIndex}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/90">
                        <div className="flex items-center">
                          <div className="flex space-x-1">
                            {ticket.numbers.map((num, idx) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary border border-primary/30 text-xs lotto-number"
                              >
                                {num.toString().padStart(2, '0')}
                              </span>
                            ))}
                          </div>
                          <span className="mx-2 text-white/50">+</span>
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-accent/10 text-accent border border-accent/30 text-xs lotto-number">
                            {ticket.lottoNumber.toString().padStart(2, '0')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                        {formatDate(ticket.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ticket.claimed ? (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-900/20 text-gray-400 border border-gray-500/30">
                            Claimed
                          </span>
                        ) : (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/20 text-green-400 border border-green-500/30">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ticket.isWinner ? (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-900/20 text-yellow-400 border border-yellow-500/30">
                            {ticket.prizeAmount} ETH
                          </span>
                        ) : (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-900/20 text-gray-400 border border-gray-500/30">
                            No Prize
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ticket.isWinner && !ticket.claimed && (
                          <Button
                            onClick={() => handleClaimPrize(ticket.drawId, ticket.ticketIndex)}
                            className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                          >
                            Claim Prize
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}