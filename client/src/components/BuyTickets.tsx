import React, { useState, useEffect, Dispatch, SetStateAction, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useWallet } from '@/hooks/useWallet';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useDrawDate } from '@/hooks/useDrawDate';
import { Wallet, Shuffle, TicketIcon, RefreshCw, Calendar, Plus, AlertTriangle } from 'lucide-react';
import WalletModal from './modals/WalletModal';
import BuyConfirmationModal from './modals/BuyConfirmationModal';
import TicketReconfirmationModal from './modals/TicketReconfirmationModal';
import TransactionPendingModal from './modals/TransactionPendingModal';
import TransactionSuccessModal from './modals/TransactionSuccessModal';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Stable default numbers for non-connected state
const DEFAULT_SELECTED_NUMBERS = [7, 14, 21, 42, 63];
const DEFAULT_LOTTO_NUMBER = 17;
const STABLE_TICKET_PRICE = 0.0001;
const NETWORK_FEE = 0.0025;

// Props interface for shared state
interface BuyTicketsProps {
  sharedSeriesIndex?: number;
  setSharedSeriesIndex?: Dispatch<SetStateAction<number | undefined>>;
  sharedDrawId?: number;
  setSharedDrawId?: Dispatch<SetStateAction<number | undefined>>;
}

// Using React.memo to prevent unnecessary re-renders
const BuyTickets = React.memo(function BuyTickets({
  sharedSeriesIndex,
  setSharedSeriesIndex,
  sharedDrawId,
  setSharedDrawId
}: BuyTicketsProps) {
  // Ref to track if numbers have been initialized
  const hasInitializedRef = useRef(false);
  
  // State for selected numbers (5 main numbers + 1 LOTTO number)
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>(DEFAULT_SELECTED_NUMBERS);
  const [selectedLottoNumber, setSelectedLottoNumber] = useState<number | null>(DEFAULT_LOTTO_NUMBER);
  
  // UI states
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showBuyConfirmModal, setShowBuyConfirmModal] = useState(false);
  const [showReconfirmModal, setShowReconfirmModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  
  // Multiple ticket system - each ticket has unique numbers
  const [tickets, setTickets] = useState<Array<{id: string, numbers: number[], lottoNumber: number | null}>>([
    {id: `ticket-${Date.now()}`, numbers: [...DEFAULT_SELECTED_NUMBERS], lottoNumber: DEFAULT_LOTTO_NUMBER}
  ]);
  const [activeTicketIndex, setActiveTicketIndex] = useState(0);
  
  const { 
    lotteryData, 
    formatUSD, 
    buyCustomTicket: buyTicket,
    buyMultipleTicketsMutation,
    generateQuickPick: genQuickPick, 
    isBuyingTickets,
    seriesList,
    isLoadingSeriesList,
    seriesDraws,
    isLoadingSeriesDraws,
    totalDrawsCount,
    isLoadingTotalDrawsCount,
    selectedSeriesIndex,
    selectedDrawId,
    setSelectedSeriesIndex,
    setSelectedDrawId,
    hasAvailableDraws: isDrawAvailable,
    getSelectedDrawTicketPrice,
    timeRemaining
  } = useLotteryData();
  const { isConnected } = useWallet();
  const { settings } = useAppSettings();
  const { getDrawDate } = useDrawDate();
  const { toast } = useToast();
  
  // Memoize the current ticket price to avoid recalculating on every render
  const rawTicketPrice = useMemo(() => {
    const price = getSelectedDrawTicketPrice();
    return price;
  }, [getSelectedDrawTicketPrice, selectedDrawId, sharedDrawId]);

  // Only log when ticket price changes
  useEffect(() => {
    console.log('BuyTickets - Ticket Price:', {
      rawPrice: rawTicketPrice,
      parsedPrice: isDrawAvailable() ? parseFloat(rawTicketPrice || '0.01') : 0,
      selectedDrawId,
      sharedDrawId
    });
  }, [rawTicketPrice, selectedDrawId, sharedDrawId, isDrawAvailable]);
  
  // Use completely stable values when wallet is not connected to prevent flickering
  // This is the key to preventing flickering - we bypass all the data fetching processes when not connected
  const ticketPrice = !isConnected ? STABLE_TICKET_PRICE : (isDrawAvailable() ? parseFloat(rawTicketPrice || '0.01') : 0);
  const networkFee = NETWORK_FEE; // Estimated gas fee in ETH
  const totalTicketsCount = tickets.length;
  const totalTicketsPrice = ticketPrice * totalTicketsCount;
  const totalCost = totalTicketsPrice + networkFee;
  
  // Create stable series and draw name for non-connected state
  const stableSeriesName = "Beginner Series";
  const stableDrawId = 1;
  
  // Sync local state with shared state when provided and connected
  useEffect(() => {
    if (!isConnected) return;

    if (sharedSeriesIndex !== undefined && sharedSeriesIndex !== selectedSeriesIndex) {
      setSelectedSeriesIndex(sharedSeriesIndex);
    }
    if (sharedDrawId !== undefined && sharedDrawId !== selectedDrawId) {
      setSelectedDrawId(sharedDrawId);
    }
    // Only run this effect when the shared values or connection status change
  }, [isConnected, sharedSeriesIndex, sharedDrawId]);
  
  // Force a re-render when selectedDrawId changes
  useEffect(() => {
    // This will trigger when either local or shared state changes the selectedDrawId
    console.log("BuyTickets - selectedDrawId changed, forcing update:", selectedDrawId);
    // The component will re-render and get the new ticket price
  }, [selectedDrawId]);

  // Sync active ticket with selected numbers
  useEffect(() => {
    if (tickets.length > 0 && activeTicketIndex < tickets.length) {
      const ticket = tickets[activeTicketIndex];
      if (
        JSON.stringify(selectedNumbers) !== JSON.stringify(ticket.numbers) ||
        selectedLottoNumber !== ticket.lottoNumber
      ) {
        setSelectedNumbers(ticket.numbers);
        setSelectedLottoNumber(ticket.lottoNumber);
      }
    }
  }, [tickets, activeTicketIndex]);
  
  // Update active ticket when numbers change
  useEffect(() => {
    if (selectedNumbers.length === 5 && selectedLottoNumber !== null && tickets.length > 0) {
      const currentTicket = tickets[activeTicketIndex];
      if (
        JSON.stringify(currentTicket.numbers) !== JSON.stringify(selectedNumbers) ||
        currentTicket.lottoNumber !== selectedLottoNumber
      ) {
        setTickets(prev => {
          const newTickets = [...prev];
          if (activeTicketIndex < newTickets.length) {
            newTickets[activeTicketIndex] = {
              ...newTickets[activeTicketIndex],
              numbers: [...selectedNumbers],
              lottoNumber: selectedLottoNumber
            };
          }
          return newTickets;
        });
      }
    }
  }, [selectedNumbers, selectedLottoNumber, activeTicketIndex, tickets]);
  
  // Add a new ticket to the list
  const addNewTicket = () => {
    // Generate new unique ID
    const newTicketId = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate random numbers for the new ticket
    const { numbers, lottoNumber } = isConnected 
      ? genQuickPick() 
      : { numbers: [...DEFAULT_SELECTED_NUMBERS], lottoNumber: DEFAULT_LOTTO_NUMBER };
    
    // Add the new ticket to the list
    setTickets(prev => [...prev, { id: newTicketId, numbers, lottoNumber }]);
    
    // Switch to the new ticket
    setActiveTicketIndex(tickets.length);
  };
  
  // Remove a ticket from the list
  const removeTicket = (index: number) => {
    if (tickets.length <= 1) {
      // Don't allow removing the last ticket
      toast({
        title: "Cannot Remove Ticket",
        description: "You must have at least one ticket.",
        variant: "destructive"
      });
      return;
    }
    
    setTickets(prev => {
      const newTickets = [...prev];
      newTickets.splice(index, 1);
      return newTickets;
    });
    
    // Adjust active ticket index if needed
    if (index <= activeTicketIndex) {
      setActiveTicketIndex(Math.max(0, activeTicketIndex - 1));
    }
  };
  
  // Handle quick pick generation for current ticket
  const handleQuickPick = () => {
    if (!isConnected) {
      // Use stable, pre-defined numbers when no wallet is connected
      // This prevents constant re-renders and flickering
      setSelectedNumbers(DEFAULT_SELECTED_NUMBERS);
      setSelectedLottoNumber(DEFAULT_LOTTO_NUMBER);
    } else {
      // Use random generation only when wallet is connected
      const { numbers, lottoNumber } = genQuickPick();
      setSelectedNumbers(numbers);
      setSelectedLottoNumber(lottoNumber);
    }
  };
  
  // Handle number selection
  const toggleNumber = (num: number) => {
    setSelectedNumbers(prev => {
      if (prev.includes(num)) {
        return prev.filter(n => n !== num);
      } else {
        if (prev.length < 5) {
          return [...prev, num];
        }
        return prev;
      }
    });
  };
  
  // Handle LOTTO number selection
  const toggleLottoNumber = (num: number) => {
    setSelectedLottoNumber(prev => prev === num ? null : num);
  };
  
  // Handle series change
  const handleSeriesChange = (value: string) => {
    const seriesIndex = parseInt(value);
    
    // Update local state through the hook
    setSelectedSeriesIndex(seriesIndex);
    
    // Update shared state if available
    if (setSharedSeriesIndex) {
      setSharedSeriesIndex(seriesIndex);
    }
    
    // Reset draw selection when series changes
    setSelectedDrawId(undefined);
    
    // Also reset shared draw ID if available
    if (setSharedDrawId) {
      setSharedDrawId(undefined);
    }
  };
  
  // Handle draw change
  const handleDrawChange = (value: string) => {
    const drawId = parseInt(value);
    
    // Update local state through the hook
    setSelectedDrawId(drawId);
    
    // Update shared state if available
    if (setSharedDrawId) {
      setSharedDrawId(drawId);
    }
  };
  
  // Check if time remaining is zero
  const isTimeRemainingZero = () => {
    return timeRemaining && 
           timeRemaining.days === 0 && 
           timeRemaining.hours === 0 && 
           timeRemaining.minutes === 0 && 
           timeRemaining.seconds === 0;
  };

  // Handle buy click
  const handleBuyClick = () => {
    if (!isConnected) {
      setShowWalletModal(true);
      return;
    }
    
    if (selectedNumbers.length !== 5 || selectedLottoNumber === null) {
      return;
    }
    
    // Check if draws are available
    if (!isDrawAvailable()) {
      toast({
        title: "Cannot Purchase Ticket",
        description: "No lottery draws are available for the selected series.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if time remaining is zero
    if (isTimeRemainingZero()) {
      toast({
        title: "Draw Closed",
        description: "The time for this draw has expired. Please select a different draw.",
        variant: "destructive"
      });
      return;
    }
    
    setShowBuyConfirmModal(true);
  };
  
  // Handle initial confirmation
  const handleInitialConfirm = () => {
    if (selectedNumbers.length !== 5 || selectedLottoNumber === null) {
      return;
    }
    
    // Check if draws are available
    if (!isDrawAvailable()) {
      setShowBuyConfirmModal(false);
      toast({
        title: "Cannot Purchase Ticket",
        description: "No lottery draws are available for the selected series.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if time remaining is zero
    if (isTimeRemainingZero()) {
      setShowBuyConfirmModal(false);
      toast({
        title: "Draw Closed",
        description: "The time for this draw has expired. Please select a different draw.",
        variant: "destructive"
      });
      return;
    }
    
    // Close first confirmation modal and open final reconfirmation modal
    setShowBuyConfirmModal(false);
    setShowReconfirmModal(true);
  };
  
  // Generate multiple quick pick tickets when needed
  const generateMultipleTickets = (count: number) => {
    // Start with the currently selected ticket
    const tickets: Array<{numbers: number[], lottoNumber: number}> = [
      { numbers: [...selectedNumbers], lottoNumber: selectedLottoNumber || 1 }
    ];
    
    // Generate additional tickets if needed
    for (let i = 1; i < count; i++) {
      const { numbers, lottoNumber } = genQuickPick();
      tickets.push({ numbers, lottoNumber });
    }
    
    return tickets;
  };

  // Handle final confirmation and purchase
  const handleConfirmPurchase = async () => {
    // Validate all tickets
    for (const ticket of tickets) {
      if (ticket.numbers.length !== 5 || ticket.lottoNumber === null) {
        toast({
          title: "Invalid Ticket",
          description: "Each ticket must have 5 numbers and 1 LOTTO number selected.",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Check if draws are available
    if (!isDrawAvailable()) {
      setShowReconfirmModal(false);
      toast({
        title: "Cannot Purchase Ticket",
        description: "No lottery draws are available for the selected series.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if time remaining is zero
    if (isTimeRemainingZero()) {
      setShowReconfirmModal(false);
      toast({
        title: "Draw Closed",
        description: "The time for this draw has expired. Please select a different draw.",
        variant: "destructive"
      });
      return;
    }
    
    // Close reconfirmation modal and show pending transaction
    setShowReconfirmModal(false);
    setShowPendingModal(true);
    
    let result;
    
    // Buy a single ticket or multiple tickets based on the tickets array
    if (tickets.length === 1) {
      // Single ticket purchase - use the existing function
      const ticket = tickets[0];
      result = await buyTicket(
        ticket.numbers, 
        ticket.lottoNumber || 1, // Fallback to 1 if null (should never happen due to validation)
        selectedSeriesIndex,
        selectedDrawId
      );
    } else {
      // Multiple tickets purchase - prepare the format expected by the API
      const ticketsForContract = tickets.map(ticket => ({
        numbers: ticket.numbers,
        lottoNumber: ticket.lottoNumber || 1 // Fallback to 1 if null (should never happen due to validation)
      }));
      
      // Use the buyMultipleTicketsMutation directly
      try {
        result = await buyMultipleTicketsMutation.mutateAsync({
          tickets: ticketsForContract,
          seriesIndex: selectedSeriesIndex,
          drawId: selectedDrawId
        });
      } catch (error) {
        console.error('Error buying multiple tickets:', error);
        toast({
          title: "Purchase Failed",
          description: "There was an error processing your transaction. Please try again.",
          variant: "destructive"
        });
        setShowPendingModal(false);
        return;
      }
    }
    
    setShowPendingModal(false);
    
    if (result && result.success && result.txHash) {
      setTransactionHash(result.txHash);
      setShowSuccessModal(true);
      
      // Reset to a single ticket after successful purchase
      setTickets([{
        id: `ticket-${Date.now()}`, 
        numbers: [...DEFAULT_SELECTED_NUMBERS], 
        lottoNumber: DEFAULT_LOTTO_NUMBER
      }]);
      setActiveTicketIndex(0);
    }
  };
  
  // Render number selection grid (1-70)
  const renderNumberGrid = () => {
    const grid = [];
    for (let i = 1; i <= 70; i++) {
      const isSelected = selectedNumbers.includes(i);
      const isDisabled = selectedNumbers.length >= 5 && !isSelected;
      
      grid.push(
        <Button
          key={i}
          type="button"
          variant={isSelected ? "default" : "outline"}
          onClick={() => toggleNumber(i)}
          className={`h-10 w-10 p-0 lotto-number relative transition-all ${
            isSelected 
              ? "bg-primary text-black scale-110 shadow-md animate-glow" 
              : "bg-card/80 text-white border border-primary/30 hover:bg-primary/20 hover:border-primary/50"
          } ${isDisabled ? "opacity-50" : ""}`}
          disabled={isDisabled}
        >
          {i < 10 ? `0${i}` : i}
          {isSelected && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white">
              ✓
            </span>
          )}
        </Button>
      );
    }
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/70 italic">
            Click a number to select, click again to deselect
          </span>
        </div>
        <div className="grid grid-cols-10 gap-2 mb-6">
          {grid}
        </div>
      </div>
    );
  };
  
  // Render LOTTO number selection grid (1-30)
  const renderLottoNumberGrid = () => {
    const grid = [];
    for (let i = 1; i <= 30; i++) {
      const isSelected = selectedLottoNumber === i;
      
      grid.push(
        <Button
          key={i}
          type="button"
          variant={isSelected ? "default" : "outline"}
          onClick={() => toggleLottoNumber(i)}
          className={`h-10 w-10 p-0 lotto-number relative transition-all ${
            isSelected 
              ? "bg-accent text-black scale-110 shadow-md animate-glow" 
              : "bg-black/50 text-white border border-accent/30 hover:bg-accent/20 hover:border-accent/50"
          }`}
        >
          {i < 10 ? `0${i}` : i}
          {isSelected && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white">
              ✓
            </span>
          )}
        </Button>
      );
    }
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/70 italic">
            Click a number to select, click again to deselect
          </span>
        </div>
        <div className="grid grid-cols-10 gap-2 mb-6">
          {grid}
        </div>
      </div>
    );
  };
  
  // Render ticket summary section
  const renderTicketSummary = () => {
    // Determine which series and draw info to display based on connection status
    const displaySeriesName = !isConnected 
      ? stableSeriesName 
      : (selectedSeriesIndex !== undefined && seriesList?.find(s => s.index === selectedSeriesIndex)?.name || "");
    
    const displayDrawId = !isConnected 
      ? stableDrawId 
      : selectedDrawId;
    
    return (
      <div className="bg-black/30 border border-primary/20 rounded-lg p-5 space-y-4">
        {/* Draw information - Selected from Hero Banner */}
        <div className="mb-2 text-center">
          <div className="text-sm text-white/80 mb-1 font-medium">
            {!isConnected ? (
              `${stableSeriesName} - Draw #${stableDrawId}`
            ) : settings.showSeriesDropdown ? (
              // When series dropdown is enabled, show series and draw
              `${displaySeriesName}${displayDrawId ? ` - Draw #${displayDrawId}` : ''}`
            ) : (
              // When series dropdown is disabled, show draw with date
              `Draw #${displayDrawId} ${seriesDraws && displayDrawId ? `(${getDrawDate(seriesDraws, displayDrawId)})` : ''}`
            )}
          </div>
          <div className="text-xs text-white/50 flex items-center justify-center">
            {!settings.showSeriesDropdown && isConnected && (
              <Calendar className="h-3 w-3 mr-1 text-primary/70" />
            )}
            {isConnected ? "(Change draw selection in the banner above)" : "(Connect wallet to select draw)"}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/70">Your Numbers:</span>
            <span className="lotto-number text-primary">
              {selectedNumbers.length > 0 
                ? selectedNumbers.sort((a, b) => a - b).map(n => n < 10 ? `0${n}` : n).join(', ') 
                : 'None selected'}
            </span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/70">Your LOTTO Number:</span>
            <span className="lotto-number text-accent">
              {selectedLottoNumber 
                ? (selectedLottoNumber < 10 ? `0${selectedLottoNumber}` : selectedLottoNumber) 
                : 'None selected'}
            </span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/70">Ticket Price:</span>
            <span className="crypto-value text-white">
              {ticketPrice} ETH
              <span className="text-sm text-primary/80 block text-right">
                {formatUSD(ticketPrice)}
              </span>
            </span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/70">Number of Tickets:</span>
            <span className="text-white font-medium">{tickets.length}</span>
          </div>
          
          {/* Ticket Tabs */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Your Tickets:</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 py-0 rounded-md text-xs"
                  onClick={addNewTicket}
                  disabled={tickets.length >= 20} // Limit to 20 tickets
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Ticket
                </Button>
              </div>
            </div>
            
            {/* Ticket tabs */}
            <div className="flex flex-wrap gap-2 pb-2">
              {tickets.map((ticket, index) => (
                <Button
                  key={ticket.id}
                  variant={activeTicketIndex === index ? "default" : "outline"}
                  size="sm"
                  className={`relative h-8 min-w-[3rem] rounded-md p-1 text-xs ${
                    activeTicketIndex === index ? "bg-primary text-black" : "bg-black/50"
                  }`}
                  onClick={() => setActiveTicketIndex(index)}
                >
                  Ticket {index + 1}
                  {tickets.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full bg-red-600 hover:bg-red-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTicket(index);
                      }}
                    >
                      ×
                    </Button>
                  )}
                </Button>
              ))}
            </div>
            
            {/* Active ticket details */}
            <div className="bg-black/20 rounded-md p-3 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-white/70">Ticket {activeTicketIndex + 1} Numbers:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 py-0 text-xs"
                  onClick={handleQuickPick}
                >
                  <Shuffle className="h-3 w-3 mr-1" /> Quick Pick
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {tickets[activeTicketIndex]?.numbers.sort((a, b) => a - b).map((num) => (
                  <span key={num} className="inline-block h-6 w-6 rounded-full bg-primary/20 text-primary text-center text-xs leading-6 lotto-number">
                    {num < 10 ? `0${num}` : num}
                  </span>
                ))}
                <span className="inline-block h-6 px-2 rounded-full bg-accent/20 text-accent text-center text-xs leading-6 lotto-number">
                  {tickets[activeTicketIndex]?.lottoNumber !== null
                    ? (tickets[activeTicketIndex]?.lottoNumber || 0) < 10 
                      ? `0${tickets[activeTicketIndex]?.lottoNumber}` 
                      : tickets[activeTicketIndex]?.lottoNumber
                    : '??'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/70">Total Tickets Price:</span>
            <span className="crypto-value text-white">
              {totalTicketsPrice} ETH
              <span className="text-sm text-primary/80 block text-right">
                {formatUSD(totalTicketsPrice)}
              </span>
            </span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/70">Network Fee:</span>
            <span className="crypto-value text-white">
              ~{networkFee} ETH
              <span className="text-sm text-primary/80 block text-right">
                {formatUSD(networkFee)}
              </span>
            </span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-white">Total Cost:</span>
            <span className="crypto-value text-white">
              {totalCost} ETH
              <span className="text-sm text-primary/80 block text-right">
                {formatUSD(totalCost)}
              </span>
            </span>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the how it works section
  const renderHowItWorks = () => {
    return (
      <div id="how-it-works" className="casino-card p-0 relative">
        <div className="casino-card-header bg-card/80 py-4 px-6 text-center">
          <div className="text-sm uppercase tracking-widest font-bold text-primary">
            How It Works
          </div>
        </div>
        
        <div className="p-6 pt-12 space-y-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center lotto-number mr-4 text-primary">
              1
            </div>
            <div>
              <p className="text-white font-medium">Choose 5 numbers from 1-70 and 1 LOTTO number from 1-30</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center lotto-number mr-4 text-primary">
              2
            </div>
            <div>
              <p className="text-white font-medium">Purchase your ticket using ETH</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center lotto-number mr-4 text-primary">
              3
            </div>
            <div>
              <p className="text-white font-medium">Wait for the draw to complete</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center lotto-number mr-4 text-primary">
              4
            </div>
            <div>
              <p className="text-white font-medium">Check your results and claim any winnings</p>
            </div>
          </div>
          
          <div className="bg-secondary/30 rounded-lg p-4 mt-6 border border-primary/10">
            <h4 className="text-primary font-bold text-lg mb-2">Prize Tiers</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white">Match 5 + LOTTO number:</span>
                <span className="text-primary font-semibold crypto-value">Jackpot</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Match 5 numbers:</span>
                <span className="text-primary font-semibold crypto-value">25% of pool</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Match 4 + LOTTO number:</span>
                <span className="text-primary font-semibold crypto-value">5% of pool</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Match 4 numbers:</span>
                <span className="text-primary font-semibold crypto-value">2.5% of pool</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Match 3 + LOTTO number:</span>
                <span className="text-primary font-semibold crypto-value">1% of pool</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <section id="buy-tickets" className="mb-16">
      <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-yellow-500 text-transparent bg-clip-text">
        Pick Your Lucky Numbers
      </h2>
      <div className="grid grid-cols-1 gap-8">
        {/* CHOOSE YOUR LOTTERY NUMBERS Section - First */}
        <div className="casino-card overflow-hidden">
          <div className="casino-card-header flex items-center justify-between py-4 px-6">
            <div className="flex items-center">
              <div className="text-sm uppercase tracking-widest font-bold text-primary mr-3">Choose Your Lottery Numbers</div>
            </div>
            <Button
              onClick={handleQuickPick}
              variant="outline"
              size="sm"
              className="flex items-center text-xs border-primary/30 text-primary hover:text-white hover:bg-primary/20"
            >
              <Shuffle className="mr-1 h-3 w-3" /> Quick Pick
            </Button>
          </div>
          <div className="p-6 lg:p-8">
            {/* Tabs for selection methods */}
            <div className="flex border-b border-primary/20 mb-6">
              <div className="py-3 px-6 cursor-pointer font-medium border-b-2 border-primary text-primary">
                Quick Pick
              </div>
              <div 
                className="py-3 px-6 cursor-pointer font-medium text-white/70 hover:text-white"
                onClick={() => window.location.href = '/pick-numbers'}
              >
                Pick Your Own Numbers
              </div>
            </div>
            <div className="text-center mb-6">
              <p className="text-white/80 mb-6">
                Get a random selection of lottery numbers with just one click!
              </p>
              <Button 
                onClick={handleQuickPick}
                className="mb-8 bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-600 hover:to-primary text-black font-bold rounded-lg py-5 h-14 text-lg transition-all shadow-lg btn-glow"
              >
                <Shuffle className="mr-2 h-5 w-5" />
                Generate Quick Pick
              </Button>
            </div>
            {/* Display Selected Numbers */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Your Selected Numbers
              </h3>
              {renderTicketSummary()}
            </div>
            {/* Buy Button */}
            {!isConnected ? (
              <Button
                onClick={() => setShowWalletModal(true)}
                className="btn-glow w-full bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-600 hover:to-primary text-black font-bold rounded-lg py-5 h-14 text-lg transition-all shadow-lg"
              >
                <Wallet className="mr-2 h-5 w-5" />
                Connect Wallet to Buy
              </Button>
            ) : (
              <Button
                onClick={handleBuyClick}
                disabled={
                  isBuyingTickets || 
                  selectedNumbers.length !== 5 || 
                  selectedLottoNumber === null ||
                  !isDrawAvailable() ||
                  isTimeRemainingZero()
                }
                className="btn-glow w-full bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-600 hover:to-primary text-black font-bold rounded-lg py-5 h-14 text-lg transition-all shadow-lg"
              >
                {isBuyingTickets 
                  ? 'Processing...' 
                  : tickets.length > 1 
                    ? `Buy ${tickets.length} Tickets Now` 
                    : 'Buy Ticket Now'
                }
              </Button>
            )}
          </div>
        </div>
        {/* HOW IT WORKS Section - Now Second (moved below) */}
        {renderHowItWorks()}
      </div>
      <WalletModal 
        open={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />
      <BuyConfirmationModal
        open={showBuyConfirmModal}
        onClose={() => setShowBuyConfirmModal(false)}
        onConfirm={handleInitialConfirm}
        tickets={tickets}
        ticketPrice={ticketPrice}
        totalTicketsPrice={totalTicketsPrice}
        networkFee={networkFee}
        totalCost={totalCost}
        selectedNumbers={selectedNumbers}
        selectedLottoNumber={selectedLottoNumber}
      />
      <TicketReconfirmationModal
        open={showReconfirmModal}
        onClose={() => setShowReconfirmModal(false)}
        onConfirm={handleConfirmPurchase}
        tickets={tickets}
        ticketPrice={ticketPrice}
        totalTicketsPrice={totalTicketsPrice}
        networkFee={networkFee}
        totalCost={totalCost}
        selectedNumbers={selectedNumbers}
        selectedLottoNumber={selectedLottoNumber}
        seriesName={!isConnected ? stableSeriesName : (selectedSeriesIndex !== undefined ? seriesList?.find(s => s.index === selectedSeriesIndex)?.name : "")}
        drawId={!isConnected ? stableDrawId : selectedDrawId}
      />
      <TransactionPendingModal
        open={showPendingModal}
        onClose={() => setShowPendingModal(false)}
        transactionHash={transactionHash}
      />
      <TransactionSuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        ticketCount={tickets.length}
        tickets={tickets}
        totalCost={totalCost}
        transactionHash={transactionHash}
        selectedNumbers={selectedNumbers}
        selectedLottoNumber={selectedLottoNumber}
      />
    </section>
  );
});

export default BuyTickets;
