import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Shuffle, Plus, Calendar } from 'lucide-react';
import { useAppKitAccount, useAppKit } from '@reown/appkit/react';
import { useToast } from '@/hooks/use-toast';
import { useLotteryContract } from '@/hooks/useLotteryContract';
import { NumberSelectionGrid } from './NumberSelectionGrid';
import BuyConfirmationModal from './modals/BuyConfirmationModal';
import TransactionPendingModal from './modals/TransactionPendingModal';
import TransactionSuccessModal from './modals/TransactionSuccessModal';
import TicketReconfirmationModal from './modals/TicketReconfirmationModal';
import { useMaticPrice } from '@/hooks/useEthPrice';

// Stable default numbers for non-connected state
const DEFAULT_SELECTED_NUMBERS: number[] = [];
const DEFAULT_LOTTO_NUMBER: number | null = null;

// Props interface for shared state
interface BuyTicketsProps {
  sharedSeriesIndex?: number;
  setSharedSeriesIndex?: (index: number) => void;
  sharedDrawId?: number;
  setSharedDrawId?: (id: number) => void;
}

const BuyTickets = React.memo(function BuyTickets({
  sharedSeriesIndex,
  sharedDrawId
}: BuyTicketsProps) {
  // Multiple ticket system - each ticket has unique numbers
  const [tickets, setTickets] = useState<Array<{id: string, numbers: number[], lottoNumber: number | null, seriesIndex: number, drawId: number}>>([
    {id: `ticket-${Date.now()}`, numbers: [], lottoNumber: null, seriesIndex: sharedSeriesIndex ?? 0, drawId: sharedDrawId ?? 0}
  ]);
  const [activeTicketIndex, setActiveTicketIndex] = useState(0);
  // Ref to always have the latest activeTicketIndex
  const activeTicketIndexRef = useRef(activeTicketIndex);
  useEffect(() => {
    activeTicketIndexRef.current = activeTicketIndex;
  }, [activeTicketIndex]);
  
  // UI states
  const [showBuyConfirmModal, setShowBuyConfirmModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [ticketPrice, setTicketPrice] = useState(0);
  
  // Buy transaction states
  const [isBuying, setIsBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const { toast } = useToast();
  const { 
    generateQuickPick,
    buyTicket,
    getLotteryData,
    getTicketPrice,
    buyMultipleTickets
  } = useLotteryContract();
  
  const [showReconfirmModal, setShowReconfirmModal] = useState(false);
  const [isDrawAvailable, setIsDrawAvailable] = useState(true);
  const [isDrawCompleted, setIsDrawCompleted] = useState(false);
  
  // Ref to track previous values and prevent infinite loops
  const prevValuesRef = useRef<{numbers: number[], lottoNumber: number | null}>({numbers: [], lottoNumber: null});
  
  // Add purchasedTickets, purchasedSeriesIndex, and purchasedDrawId state
  const [purchasedTickets, setPurchasedTickets] = useState<Array<{id: string, numbers: number[], lottoNumber: number | null, seriesIndex?: number, drawId?: number}>>([]);
  const [purchasedSeriesIndex, setPurchasedSeriesIndex] = useState<number | null>(null);
  const [purchasedDrawId, setPurchasedDrawId] = useState<number | null>(null);
  
  // Fetch ticket price when connected or draw changes
  useEffect(() => {
    const fetchTicketPrice = async () => {
      if (isConnected && sharedDrawId !== undefined) {
        const price = await getTicketPrice(sharedDrawId);
        setTicketPrice(price);
      }
    };
    fetchTicketPrice();
  }, [isConnected, sharedDrawId, getTicketPrice]);
  
  // Add effect to check draw availability
  useEffect(() => {
    const checkDrawAvailability = async () => {
      if (!isConnected || !sharedDrawId) {
        console.log('Draw check: Not connected or no draw ID');
        setIsDrawAvailable(false);
        setIsDrawCompleted(false);
        return;
      }

      try {
        console.log('Checking draw availability for:', { seriesIndex: sharedSeriesIndex, drawId: sharedDrawId });
        const lotteryData = await getLotteryData(sharedSeriesIndex, sharedDrawId);
        console.log('Lottery data received:', lotteryData);
        
        if (!lotteryData) {
          console.log('No lottery data found');
          setIsDrawAvailable(false);
          setIsDrawCompleted(false);
          return;
        }

        const isCompleted = lotteryData.completed || false;
        console.log('Draw completed status:', isCompleted);
        
        setIsDrawAvailable(true);
        setIsDrawCompleted(isCompleted);
      } catch (error) {
        console.error('Error checking draw availability:', error);
        setIsDrawAvailable(false);
        setIsDrawCompleted(false);
      }
    };

    checkDrawAvailability();
  }, [isConnected, sharedDrawId, sharedSeriesIndex, getLotteryData]);
  
  // Use completely stable values when wallet is not connected to prevent flickering
  const totalTicketsCount = tickets.length;
  const totalTicketsPrice = ticketPrice * totalTicketsCount;
  const totalCost = totalTicketsPrice;
  
  // Create stable series and draw name for non-connected state
  const stableSeriesName = "Beginner Series";
  const stableDrawId = 1;
  
  // Add a new ticket to the list
  const addNewTicket = () => {
    const newTicketId = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setTickets(prev => [
      ...prev,
      {
        id: newTicketId,
        numbers: [],
        lottoNumber: null,
        seriesIndex: sharedSeriesIndex ?? 0,
        drawId: sharedDrawId ?? 0
      }
    ]);
    setActiveTicketIndex(tickets.length);
  };
  
  // Remove a ticket
  const handleRemoveTicket = (ticketId: string) => {
    console.log('=== Removing Ticket ===');
    console.log('Ticket ID to remove:', ticketId);
    console.log('Current tickets:', tickets);
    
    // Find the index of the ticket to remove
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) {
      console.error('Ticket not found:', ticketId);
      return;
    }
    
    console.log('Removing ticket at index:', ticketIndex);
    
    // Remove the ticket
    const newTickets = tickets.filter(t => t.id !== ticketId);
    console.log('New tickets array:', newTickets);
    
    // Update tickets state
    setTickets(newTickets);
    
    // Handle active ticket index and numbers
    if (newTickets.length === 0) {
      // If no tickets left, reset to defaults
      console.log('No tickets left, resetting to defaults');
      setActiveTicketIndex(0);
    } else {
      // If we removed the active ticket
      if (ticketIndex === activeTicketIndex) {
        // Select the last remaining ticket
        const newIndex = newTickets.length - 1;
        console.log('Setting new active ticket index:', newIndex);
        setActiveTicketIndex(newIndex);
      } else if (ticketIndex < activeTicketIndex) {
        // If we removed a ticket before the active one, adjust the active index
        console.log('Adjusting active ticket index');
        setActiveTicketIndex(activeTicketIndex - 1);
      }
      // If we removed a ticket after the active one, no need to change anything
    }
    
    console.log('=== Ticket Removal Complete ===');
  };
  
  // Handle ticket tab click
  const handleTicketSelect = (index: number) => {
    console.log('=== Selecting Ticket ===');
    console.log('Selecting ticket at index:', index);
    console.log('Current tickets:', tickets);
    
    // Update active ticket index
    setActiveTicketIndex(index);
    
    console.log('=== Ticket Selection Complete ===');
  };
  
  // Handle quick pick generation
  const handleQuickPick = useCallback(() => {
    const quickPick = generateQuickPick();
    
    // Update active ticket
    setTickets(prev => {
      const idx = activeTicketIndexRef.current;
      const newTickets = [...prev];
      newTickets[idx] = {
        ...newTickets[idx],
        numbers: quickPick.numbers,
        lottoNumber: quickPick.lottoNumber,
        seriesIndex: sharedSeriesIndex ?? 0,
        drawId: sharedDrawId ?? 0
      };
      return newTickets;
    });
  }, [generateQuickPick, activeTicketIndex, sharedSeriesIndex, sharedDrawId]);
  
  // Handle number selection
  const handleNumbersSelected = (numbers: number[], lottoNumber: number | null) => {
    console.log('=== Updating Numbers ===');
    console.log('New numbers:', numbers);
    console.log('New lotto number:', lottoNumber);
    console.log('Active ticket index:', activeTicketIndexRef.current);
    
    // Check if the values have actually changed to prevent infinite loops
    const prevValues = prevValuesRef.current;
    const numbersChanged = JSON.stringify(prevValues.numbers) !== JSON.stringify(numbers) ||
                          prevValues.lottoNumber !== lottoNumber;
    
    if (!numbersChanged) {
      console.log('Numbers unchanged, skipping update');
      return;
    }
    
    // Update the ref with new values
    prevValuesRef.current = {numbers: [...numbers], lottoNumber};
    
    // Update the active ticket's numbers using the latest index
    setTickets(prev => {
      const idx = activeTicketIndexRef.current;
      const newTickets = [...prev];
      newTickets[idx] = {
        ...newTickets[idx],
        numbers: [...numbers],
        lottoNumber,
        seriesIndex: sharedSeriesIndex ?? 0,
        drawId: sharedDrawId ?? 0
      };
      console.log('Updated tickets:', newTickets);
      return newTickets;
    });
    
    console.log('=== Numbers Update Complete ===');
  };

  // Handle buy click
  const handleBuyClick = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to buy tickets",
        variant: "destructive"
      });
      return;
    }
    
    if (tickets[activeTicketIndex]?.numbers.length !== 5 || tickets[activeTicketIndex]?.lottoNumber === null) {
      toast({
        title: "Invalid Selection",
        description: "Please select 5 main numbers and 1 LOTTO number.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if draw is available by getting lottery data
    if (sharedSeriesIndex !== undefined && sharedDrawId !== undefined) {
      try {
        const lotteryData = await getLotteryData(sharedSeriesIndex, sharedDrawId);
        if (!lotteryData) {
      toast({
            title: "Draw Not Available",
            description: "This draw is no longer available for ticket purchases.",
        variant: "destructive"
      });
      return;
    }
      } catch (error) {
        console.error('Error checking lottery data:', error);
      toast({
          title: "Error",
          description: "Failed to check draw availability. Please try again.",
        variant: "destructive"
      });
      return;
      }
    }
    
    setShowBuyConfirmModal(true);
  };
  
  // Handle initial confirmation
  const handleInitialConfirm = () => {
    if (tickets[activeTicketIndex]?.numbers.length !== 5 || tickets[activeTicketIndex]?.lottoNumber === null) {
      return;
    }
    
    setShowBuyConfirmModal(false);
    setShowReconfirmModal(true);
  };
  
  // Handle final confirmation and transaction
  const handleFinalConfirm = () => {
    console.log('=== Starting Buy Ticket Flow ===');
    console.log('Current State:', {
      tickets,
      sharedDrawId,
      ticketPrice,
      totalTicketsPrice,
      totalCost
    });

      setShowReconfirmModal(false);
    setShowPendingModal(true);
    setIsBuying(true);
    setBuyError(null);
    
    // Buy tickets
    const buyTickets = async () => {
      try {
        console.log('=== Validation Checks ===');
        if (!sharedDrawId || sharedDrawId < 0) {
          console.error('Validation Failed: Draw ID is invalid');
          throw new Error('Please select a valid draw');
        }
        console.log('Draw ID:', sharedDrawId);
        
        // Show initial pending state
        console.log('=== Starting Transaction ===');
      toast({
          title: "Preparing Transaction",
          description: "Please approve the transaction in MetaMask",
          duration: 5000
        });
    
    let result;
    
        // Choose between single and multiple ticket purchase
    if (tickets.length === 1) {
          // Single ticket purchase
          console.log('Using buyTicket for single ticket');
      result = await buyTicket(
            tickets[0].numbers,
            tickets[0].lottoNumber || 0,
            sharedDrawId
      );
    } else {
          // Multiple ticket purchase
          console.log('Using buyMultipleTickets for multiple tickets');
          const numbersList = tickets.map(ticket => ticket.numbers);
          const lottoNumbers = tickets.map(ticket => ticket.lottoNumber || 0);
          
          console.log('Multiple ticket purchase details:', {
            numbersList,
            lottoNumbers,
            drawId: sharedDrawId,
            ticketCount: tickets.length,
            totalCost: totalCost
          });

          // Validate ticket data before sending
          if (numbersList.length !== lottoNumbers.length) {
            throw new Error('Invalid ticket data: numbers and lotto numbers count mismatch');
          }

          if (numbersList.some(nums => nums.length !== 5)) {
            throw new Error('Invalid ticket data: each ticket must have exactly 5 numbers');
          }

          if (lottoNumbers.some(num => num === null || num === undefined)) {
            throw new Error('Invalid ticket data: all tickets must have a lotto number');
          }

          console.log('Sending multiple ticket purchase transaction...');
          result = await buyMultipleTickets(
            numbersList,
            lottoNumbers,
            sharedDrawId
          );
        }
        
        console.log('Raw transaction result:', result);
        
        if (!result) {
          console.error('No result received from transaction');
          throw new Error('No response from transaction');
        }
        
        console.log('Transaction Result:', {
          success: result.success,
          txHash: result.txHash,
          fullResult: result
        });
        
        if (result.success && result.txHash) {
          console.log('Transaction Successful:', result.txHash);
          // Show transaction submitted toast
          toast({
            title: "Transaction Submitted",
            description: "Your tickets are being processed",
            duration: 5000
          });

      setTransactionHash(result.txHash);
          setShowPendingModal(false);
      setPurchasedTickets([...tickets]);
      const firstWithSeries = tickets.find(t => typeof t.seriesIndex === 'number');
      const firstWithDraw = tickets.find(t => typeof t.drawId === 'number');
      setPurchasedSeriesIndex(firstWithSeries ? firstWithSeries.seriesIndex! : null);
      setPurchasedDrawId(firstWithDraw ? firstWithDraw.drawId! : null);
      setShowSuccessModal(true);
      
      // Reset to a single ticket after successful purchase
      setTickets([{
        id: `ticket-${Date.now()}`,
        numbers: [],
        lottoNumber: null,
        seriesIndex: sharedSeriesIndex ?? 0,
        drawId: sharedDrawId ?? 0
      }]);
      setActiveTicketIndex(0);
          
          // Show success toast
          toast({
            title: "Success!",
            description: `Your ${tickets.length} ticket${tickets.length > 1 ? 's' : ''} have been purchased successfully.`,
            variant: "default"
          });
        } else {
          console.error('Transaction Failed:', result.error || 'Unknown error');
          throw new Error(result.error || 'Transaction failed - invalid response structure');
        }
      } catch (error) {
        console.error('=== Error Details ===');
        console.error('Error buying tickets:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to buy tickets';
        console.error('Error Message:', errorMessage);
        setBuyError(errorMessage);
        setShowPendingModal(false);
        
        // Show appropriate error message based on the error
        if (errorMessage.includes('user rejected')) {
          console.log('Error Type: User Rejected');
          toast({
            title: "Transaction Cancelled",
            description: "You rejected the transaction in MetaMask",
            variant: "destructive"
          });
        } else if (errorMessage.includes('insufficient funds')) {
          console.log('Error Type: Insufficient Funds');
          toast({
            title: "Insufficient Funds",
            description: "You don't have enough POL to complete this transaction",
            variant: "destructive"
          });
        } else if (errorMessage.includes('gas required exceeds allowance')) {
          console.log('Error Type: Gas Limit');
          toast({
            title: "Gas Limit Too Low",
            description: "Please try again with higher gas limit",
            variant: "destructive"
          });
        } else if (errorMessage.includes('Transaction failed')) {
          console.log('Error Type: Transaction Failed');
          toast({
            title: "Transaction Failed",
            description: "The transaction was not successful. Please try again.",
            variant: "destructive"
          });
        } else {
          console.log('Error Type: Generic Error');
          toast({
            title: "Purchase Failed",
            description: errorMessage,
            variant: "destructive"
          });
        }
      } finally {
        console.log('=== Buy Ticket Flow Complete ===');
        setIsBuying(false);
      }
    };
    
    buyTickets();
  };
  
  // Handle modal close
  const handleModalClose = () => {
    setShowBuyConfirmModal(false);
    setShowReconfirmModal(false);
    setShowPendingModal(false);
    setShowSuccessModal(false);
    setBuyError(null);
    setIsBuying(false);
    setTickets([{
      id: `ticket-${Date.now()}`,
      numbers: [],
      lottoNumber: null,
      seriesIndex: sharedSeriesIndex ?? 0,
      drawId: sharedDrawId ?? 0
    }]);
    setActiveTicketIndex(0);
    setPurchasedTickets([]);
    setPurchasedSeriesIndex(null);
    setPurchasedDrawId(null);
  };
  
  // Render ticket summary section
  const renderTicketSummary = () => {
    return (
      <div className="bg-black/40 border border-primary/20 rounded-lg p-5 space-y-4">
        {/* Draw information */}
        <div className="mb-2 text-center">
          <div className="text-sm text-white/80 mb-1 font-medium">
            {!isConnected ? (
              `${stableSeriesName} - Draw #${stableDrawId}`
            ) : (
              `Draw #${sharedDrawId || stableDrawId}`
            )}
          </div>
          <div className="text-xs text-white/50 flex items-center justify-center">
              <Calendar className="h-3 w-3 mr-1 text-primary/70" />
            {isConnected ? "(Change draw selection in the banner above)" : "(Connect wallet to select draw)"}
          </div>
        </div>
        
        <div className="space-y-3">
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
                  disabled={tickets.length >= 20 || tickets[activeTicketIndex]?.numbers.length !== 5 || tickets[activeTicketIndex]?.lottoNumber === null}
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
                  onClick={() => handleTicketSelect(index)}
                >
                  Ticket {index + 1}
                  {tickets.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full bg-red-600 hover:bg-red-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTicket(ticket.id);
                      }}
                    >
                      ×
                    </Button>
                  )}
                </Button>
              ))}
            </div>
            
            {/* Active ticket details */}
            <div className="bg-black/20 rounded-md p-3 text-sm border border-primary/20">
              <div className="flex justify-between mb-2">
                <span className="text-white/70">Selected Numbers:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 py-0 text-xs border border-primary/20"
                  onClick={handleQuickPick}
                >
                  <Shuffle className="h-3 w-3 mr-1" /> Quick Pick
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {tickets[activeTicketIndex]?.numbers.map((num, index) => (
                  <span key={`${num}-${index}`} className="inline-block h-6 w-6 rounded-full bg-primary/20 text-primary text-center text-xs leading-6 lotto-number">
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

          {/* Price Summary */}
          <div className="bg-black/20 rounded-md p-3 space-y-2 border border-primary/20">
            <div className="flex justify-between">
              <span className="text-white/70">Ticket Price:</span>
              <span className="crypto-value text-white text-right">
                {isConnected ? `${ticketPrice.toFixed(5)} POL` : "-"}
                <br />
                <span className="text-xs text-gray-400">{isConnected ? formatUSD(ticketPrice) : ''}</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Number of Tickets:</span>
              <span className="text-white font-medium">{totalTicketsCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Total Cost:</span>
              <span className="crypto-value text-white text-right">
                {isConnected ? `${totalCost.toFixed(5)} POL` : "-"}
                <br />
                <span className="text-xs text-gray-400">{isConnected ? formatUSD(totalCost) : ''}</span>
              </span>
            </div>
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
              <p className="text-white font-medium">Purchase your ticket using POL</p>
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
  
  const maticPrice = useMaticPrice();
  // Utility function to format USD
  const formatUSD = (maticAmount: number) => {
    if (maticPrice === undefined) return <span className="inline-flex items-center"><svg className="animate-spin h-4 w-4 mr-1 text-gray-400" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Loading...</span>;
    if (maticPrice === null) return 'Unavailable';
    const usdAmount = maticAmount * maticPrice;
    return `≈ $${usdAmount.toFixed(5)}`;
  };

  return (
    <section id="buy-tickets" className="mb-16">
      <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-yellow-500 text-transparent bg-clip-text">
        Pick Your Lucky Numbers
      </h2>
      <div className="grid grid-cols-1 gap-8">
        {/* CHOOSE YOUR LOTTERY NUMBERS Section */}
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
            {/* Number Selection Grid */}
            <div className="mb-8">
              <NumberSelectionGrid
                onNumbersSelected={handleNumbersSelected}
                initialNumbers={tickets[activeTicketIndex]?.numbers || []}
                initialLottoNumber={tickets[activeTicketIndex]?.lottoNumber || null}
              />
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
                onClick={() => open()}
                className="w-full bg-gray-600 text-gray-300 font-bold rounded-lg py-5 h-14 text-lg transition-all shadow-lg"
              >
                Connect Wallet
              </Button>
            ) : !isDrawAvailable || isDrawCompleted ? (
              <Button
                disabled
                className="w-full bg-gray-600 text-gray-300 font-bold rounded-lg py-5 h-14 text-lg transition-all shadow-lg cursor-not-allowed"
              >
                {isDrawCompleted ? "Draw Completed" : "No Active Draw Available"}
              </Button>
            ) : (
              <Button
                onClick={handleBuyClick}
                disabled={tickets[activeTicketIndex]?.numbers.length !== 5 || tickets[activeTicketIndex]?.lottoNumber === null}
                className="btn-glow w-full bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-600 hover:to-primary text-black font-bold rounded-lg py-5 h-14 text-lg transition-all shadow-lg"
              >
                Buy Ticket Now
              </Button>
            )}
          </div>
        </div>
        
        {/* HOW IT WORKS Section */}
        {renderHowItWorks()}
      </div>
      
      <BuyConfirmationModal
        open={showBuyConfirmModal}
        onClose={handleModalClose}
        onConfirm={handleInitialConfirm}
        ticketPrice={ticketPrice}
        totalTicketsPrice={totalTicketsPrice}
        totalCost={totalCost}
        tickets={tickets}
        isConnected={isConnected}
      />
      
      <TicketReconfirmationModal
        open={showReconfirmModal}
        onClose={handleModalClose}
        onConfirm={handleFinalConfirm}
        tickets={tickets}
        ticketPrice={ticketPrice}
        totalTicketsPrice={totalTicketsPrice}
        totalCost={totalCost}
        seriesIndex={sharedSeriesIndex}
        drawId={sharedDrawId}
      />
      
      <TransactionPendingModal
        open={showPendingModal}
        onClose={handleModalClose}
        transactionHash={transactionHash}
        isBuying={isBuying}
        error={buyError}
      />
      
      <TransactionSuccessModal
        open={showSuccessModal}
        onClose={handleModalClose}
        transactionHash={transactionHash}
        ticketCount={purchasedTickets.length}
        tickets={purchasedTickets}
        totalCost={totalCost}
        drawId={purchasedDrawId ?? undefined}
        seriesIndex={purchasedSeriesIndex ?? undefined}
      />
    </section>
  );
});

export default BuyTickets;
