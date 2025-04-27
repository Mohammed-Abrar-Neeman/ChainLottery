import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, Shuffle, ArrowLeft, ChevronsRight, Plus } from 'lucide-react';
import WalletModal from '@/components/modals/WalletModal';
import BuyConfirmationModal from '@/components/modals/BuyConfirmationModal';
import TicketReconfirmationModal from '@/components/modals/TicketReconfirmationModal';
import TransactionPendingModal from '@/components/modals/TransactionPendingModal';
import TransactionSuccessModal from '@/components/modals/TransactionSuccessModal';
import { useWallet } from '@/hooks/useWallet';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useToast } from '@/hooks/use-toast';

// Define the Ticket interface
interface Ticket {
  id: string;
  numbers: number[];
  lottoNumber: number | null;
}

// Default constants
const DEFAULT_SELECTED_NUMBERS: number[] = [];
const DEFAULT_LOTTO_NUMBER: number | null = null;

const ManualSelection: React.FC = () => {
  const [, setLocation] = useLocation();
  const { isConnected, account } = useWallet();
  const { settings } = useAppSettings();
  const { toast } = useToast();
  
  // State for ticket management
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: `ticket-${Date.now()}`, numbers: [...DEFAULT_SELECTED_NUMBERS], lottoNumber: DEFAULT_LOTTO_NUMBER }
  ]);
  const [activeTicketIndex, setActiveTicketIndex] = useState(0);
  
  // State for current active ticket's number selection (UI state)
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [selectedLottoNumber, setSelectedLottoNumber] = useState<number | null>(null);
  
  // Modal states
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showBuyConfirmModal, setShowBuyConfirmModal] = useState(false);
  const [showReconfirmModal, setShowReconfirmModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Transaction state
  const [isBuyingTickets, setIsBuyingTickets] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  
  // Get lottery data using custom hook
  const {
    lotteryData,
    selectedSeriesIndex,
    selectedDrawId,
    seriesList,
    timeRemaining,
    getSelectedDrawTicketPrice,
    buyTicketMutation,
    buyMultipleTicketsMutation
  } = useLotteryData();
  
  // Derived values
  const ticketPrice = parseFloat(getSelectedDrawTicketPrice()) || 0.0001;
  const isTimeRemainingZero = () => 
    timeRemaining.days === 0 && 
    timeRemaining.hours === 0 && 
    timeRemaining.minutes === 0 && 
    timeRemaining.seconds === 0;
  const isDrawAvailable = () => !!selectedDrawId && selectedDrawId > 0;
  
  // Stable fallbacks for disconnected state
  const stableSeriesName = "Beginner Series";
  const stableDrawId = 1;
  
  // Price calculations
  const networkFee = 0.0001;
  const totalTicketsPrice = ticketPrice * tickets.length;
  const totalCost = totalTicketsPrice + networkFee;
  
  // Effect to sync the UI selection state with the current active ticket
  // This only runs when changing tickets, not when updating the current ticket
  useEffect(() => {
    if (tickets[activeTicketIndex]) {
      setSelectedNumbers(tickets[activeTicketIndex].numbers || []);
      setSelectedLottoNumber(tickets[activeTicketIndex].lottoNumber);
    }
  }, [activeTicketIndex]);
  
  // We no longer need this function as our toggleNumber and toggleLottoNumber functions
  // directly update the tickets array now
  
  // Add new ticket
  const addNewTicket = () => {
    if (tickets.length >= 20) return; // Limit to 20 tickets
    
    const newTicket: Ticket = {
      id: `ticket-${Date.now()}`,
      numbers: [],
      lottoNumber: null
    };
    
    setTickets([...tickets, newTicket]);
    setActiveTicketIndex(tickets.length);
  };
  
  // Remove ticket
  const removeTicket = (index: number) => {
    if (tickets.length <= 1) return; // Keep at least one ticket
    
    const newTickets = [...tickets];
    newTickets.splice(index, 1);
    setTickets(newTickets);
    
    // Adjust active index if needed
    if (activeTicketIndex >= newTickets.length) {
      setActiveTicketIndex(newTickets.length - 1);
    } else if (activeTicketIndex === index) {
      // If we're removing the active ticket, select the previous one
      setActiveTicketIndex(Math.max(0, index - 1));
    }
  };
  
  // Handle number selection
  const toggleNumber = (number: number) => {
    if (selectedNumbers.includes(number)) {
      const newNumbers = selectedNumbers.filter(n => n !== number);
      setSelectedNumbers(newNumbers);
      
      // Update the ticket directly instead of relying on the effect
      if (tickets[activeTicketIndex]) {
        const updatedTicket = {
          ...tickets[activeTicketIndex],
          numbers: newNumbers
        };
        
        const newTickets = [...tickets];
        newTickets[activeTicketIndex] = updatedTicket;
        setTickets(newTickets);
      }
    } else {
      if (selectedNumbers.length < 5) {
        const newNumbers = [...selectedNumbers, number];
        setSelectedNumbers(newNumbers);
        
        // Update the ticket directly
        if (tickets[activeTicketIndex]) {
          const updatedTicket = {
            ...tickets[activeTicketIndex],
            numbers: newNumbers
          };
          
          const newTickets = [...tickets];
          newTickets[activeTicketIndex] = updatedTicket;
          setTickets(newTickets);
        }
      }
    }
  };
  
  // Handle LOTTO number selection
  const toggleLottoNumber = (number: number) => {
    let newLottoNumber;
    
    if (selectedLottoNumber === number) {
      newLottoNumber = null;
    } else {
      newLottoNumber = number;
    }
    
    setSelectedLottoNumber(newLottoNumber);
    
    // Update the ticket directly
    if (tickets[activeTicketIndex]) {
      const updatedTicket = {
        ...tickets[activeTicketIndex],
        lottoNumber: newLottoNumber
      };
      
      const newTickets = [...tickets];
      newTickets[activeTicketIndex] = updatedTicket;
      setTickets(newTickets);
    }
  };
  
  // Handle Quick Pick
  const handleQuickPick = () => {
    // Generate 5 random unique numbers between 1-70
    const quickPickNumbers: number[] = [];
    while (quickPickNumbers.length < 5) {
      const randomNumber = Math.floor(Math.random() * 70) + 1;
      if (!quickPickNumbers.includes(randomNumber)) {
        quickPickNumbers.push(randomNumber);
      }
    }
    
    // Generate 1 random number between 1-30 for LOTTO
    const randomLottoNumber = Math.floor(Math.random() * 30) + 1;
    
    // Update local state
    setSelectedNumbers(quickPickNumbers);
    setSelectedLottoNumber(randomLottoNumber);
    
    // Update the ticket directly
    if (tickets[activeTicketIndex]) {
      const updatedTicket = {
        ...tickets[activeTicketIndex],
        numbers: quickPickNumbers,
        lottoNumber: randomLottoNumber
      };
      
      const newTickets = [...tickets];
      newTickets[activeTicketIndex] = updatedTicket;
      setTickets(newTickets);
    }
  };
  
  // Handle Buy Button Click
  const handleBuyClick = () => {
    if (!isConnected) {
      setShowWalletModal(true);
      return;
    }
    
    // Validate all tickets
    for (const ticket of tickets) {
      if (ticket.numbers.length !== 5 || ticket.lottoNumber === null) {
        toast({
          title: "Invalid Ticket",
          description: `Ticket ${tickets.indexOf(ticket) + 1} must have 5 numbers and 1 LOTTO number selected.`,
          variant: "destructive"
        });
        setActiveTicketIndex(tickets.indexOf(ticket));
        return;
      }
    }
    
    setShowBuyConfirmModal(true);
  };
  
  // Handle Initial Confirmation
  const handleInitialConfirm = () => {
    setShowBuyConfirmModal(false);
    setShowReconfirmModal(true);
  };
  
  // Handle Final Confirmation and Purchase
  const handleConfirmPurchase = async () => {
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
    
    try {
      // Buy a single ticket or multiple tickets based on the tickets array
      if (tickets.length === 1) {
        // Single ticket purchase
        const ticket = tickets[0];
        
        if (!ticket.numbers || ticket.numbers.length !== 5 || !ticket.lottoNumber) {
          throw new Error("Please select 5 numbers and 1 LOTTO number.");
        }
        
        // Use buyTicket function from useLotteryData with real blockchain interaction
        result = await buyTicketMutation.mutateAsync({
          numbers: ticket.numbers,
          lottoNumber: ticket.lottoNumber,
          seriesIndex: selectedSeriesIndex,
          drawId: selectedDrawId
        });
      } else {
        // Multiple tickets purchase - prepare the format expected by the contract
        const ticketsForContract = tickets.map(ticket => {
          if (!ticket.numbers || ticket.numbers.length !== 5 || !ticket.lottoNumber) {
            throw new Error("All tickets must have 5 numbers and 1 LOTTO number selected.");
          }
          return {
            numbers: ticket.numbers,
            lottoNumber: ticket.lottoNumber
          };
        });
        
        // Use the buyMultipleTicketsMutation with real blockchain interaction
        result = await buyMultipleTicketsMutation.mutateAsync({
          tickets: ticketsForContract,
          seriesIndex: selectedSeriesIndex,
          drawId: selectedDrawId
        });
      }
      
      setShowPendingModal(false);
      
      if (result && result.success && result.txHash) {
        setTransactionHash(result.txHash);
        setShowSuccessModal(true);
        
        // Reset to a single ticket after successful purchase
        setTickets([{
          id: `ticket-${Date.now()}`, 
          numbers: [],
          lottoNumber: null
        }]);
        setActiveTicketIndex(0);
      }
    } catch (error) {
      console.error("Error purchasing ticket:", error);
      setIsBuyingTickets(false);
      setShowPendingModal(false);
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your transaction. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Render number grid (1-70) with 7 numbers per row
  const renderNumberGrid = () => {
    const numberBlocks = [];
    const totalNumbers = 70;
    const numbersPerRow = 10;
    
    for (let i = 1; i <= totalNumbers; i += numbersPerRow) {
      const rowNumbers = [];
      for (let j = 0; j < numbersPerRow && i + j <= totalNumbers; j++) {
        const number = i + j;
        rowNumbers.push(
          <div 
            key={number}
            onClick={() => toggleNumber(number)}
            className={`lottery-ball ${
              selectedNumbers.includes(number) 
                ? 'bg-gradient-to-b from-primary/90 to-yellow-500 text-black border-primary' 
                : 'bg-card hover:bg-card/50 text-white border-primary/20'
            } flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-all lotto-number`}
          >
            {number < 10 ? `0${number}` : number}
          </div>
        );
      }
      
      numberBlocks.push(
        <div key={`row-${i}`} className="flex justify-center flex-wrap gap-2 mb-2">
          {rowNumbers}
        </div>
      );
    }
    
    return (
      <div className="bg-secondary/50 border border-primary/10 rounded-lg p-4 h-[340px] overflow-y-auto">
        {numberBlocks}
      </div>
    );
  };
  
  // Render LOTTO number grid (1-30) with 10 numbers per row
  const renderLottoNumberGrid = () => {
    const numberBlocks = [];
    const totalNumbers = 30;
    const numbersPerRow = 10;
    
    for (let i = 1; i <= totalNumbers; i += numbersPerRow) {
      const rowNumbers = [];
      for (let j = 0; j < numbersPerRow && i + j <= totalNumbers; j++) {
        const number = i + j;
        rowNumbers.push(
          <div 
            key={number}
            onClick={() => toggleLottoNumber(number)}
            className={`lottery-ball ${
              selectedLottoNumber === number 
                ? 'bg-gradient-to-b from-accent/90 to-accent text-white border-accent' 
                : 'bg-card hover:bg-card/50 text-white border-accent/20'
            } flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-all lotto-number`}
          >
            {number < 10 ? `0${number}` : number}
          </div>
        );
      }
      
      numberBlocks.push(
        <div key={`row-${i}`} className="flex justify-center flex-wrap gap-2 mb-2">
          {rowNumbers}
        </div>
      );
    }
    
    return (
      <div className="bg-secondary/50 border border-primary/10 rounded-lg p-4 h-[160px] overflow-y-auto">
        {numberBlocks}
      </div>
    );
  };
  
  // Render selected ticket summary
  const renderTicketSummary = () => {
    return (
      <div className="bg-card/70 rounded-lg p-4 border border-primary/20">
        {/* Current ticket display */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {selectedNumbers.length > 0 ? (
            selectedNumbers.sort((a, b) => a - b).map(number => (
              <div key={`summary-${number}`} className="lottery-ball lottery-ball-regular">
                {number < 10 ? `0${number}` : number}
              </div>
            ))
          ) : (
            <div className="text-white/50 italic">Select 5 numbers (1-70)</div>
          )}
          
          {selectedLottoNumber && (
            <div className="lottery-ball lottery-ball-special">
              {selectedLottoNumber < 10 ? `0${selectedLottoNumber}` : selectedLottoNumber}
            </div>
          )}
        </div>
        
        {/* Ticket Tabs and Management */}
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
          <div className="bg-black/20 rounded-md p-3 text-sm min-h-[80px]">
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
            <div className="flex flex-wrap gap-1 mb-2 min-h-[30px]">
              {tickets[activeTicketIndex]?.numbers.sort((a, b) => a - b).map((num) => (
                <span key={num} className="inline-block h-6 w-6 rounded-full bg-primary/20 text-primary text-center text-xs leading-6 lotto-number">
                  {num < 10 ? `0${num}` : num}
                </span>
              ))}
              {tickets[activeTicketIndex]?.lottoNumber !== null && (
                <span className="inline-block h-6 px-2 rounded-full bg-accent/20 text-accent text-center text-xs leading-6 lotto-number">
                  {tickets[activeTicketIndex]?.lottoNumber !== null
                    ? (tickets[activeTicketIndex]?.lottoNumber || 0) < 10 
                      ? `0${tickets[activeTicketIndex]?.lottoNumber}` 
                      : tickets[activeTicketIndex]?.lottoNumber
                    : '??'}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Price information */}
        <div className="space-y-3 mt-4">
          <div className="flex justify-between items-center text-sm border-t border-white/10 pt-3">
            <div className="text-white/70">Ticket Price:</div>
            <div className="text-primary font-mono">{ticketPrice.toFixed(5)} ETH</div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="text-white/70">Number of Tickets:</div>
            <div className="text-white font-medium">{tickets.length}</div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="text-white/70">Total Tickets Price:</div>
            <div className="text-primary font-mono">{totalTicketsPrice.toFixed(5)} ETH</div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="text-white/70">Network Fee:</div>
            <div className="text-white/70 font-mono">{networkFee.toFixed(5)} ETH</div>
          </div>
          <div className="border-t border-white/10 mt-2 pt-2 flex justify-between items-center">
            <div className="text-white font-medium">Total Cost:</div>
            <div className="text-primary font-medium font-mono">{totalCost.toFixed(5)} ETH</div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render step indicators
  const renderStepIndicators = () => {
    return (
      <div className="flex items-center mb-6">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center lotto-number mr-2 text-primary">
            1
          </div>
          <div className="text-white font-medium">Pick Numbers</div>
        </div>
        <ChevronsRight className="mx-4 text-primary/50" />
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-secondary/50 border border-primary/30 flex items-center justify-center lotto-number mr-2 text-primary/50">
            2
          </div>
          <div className="text-white/50">Review & Buy</div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-6 text-primary hover:text-primary hover:bg-primary/10"
        onClick={() => setLocation('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>
      
      <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-yellow-500 text-transparent bg-clip-text">
        Pick Your Lucky Numbers
      </h2>
      
      {renderStepIndicators()}
      
      <div className="casino-card overflow-hidden">
        <div className="casino-card-header flex items-center justify-between py-4 px-6">
          <div className="flex items-center">
            <div className="text-sm uppercase tracking-widest font-bold text-primary mr-3">
              Choose Your Lottery Numbers
            </div>
            <Button 
              onClick={handleQuickPick}
              variant="outline"
              size="sm"
              className="flex items-center justify-center border-primary/30 text-primary hover:bg-primary/10 hover:border-primary h-7"
            >
              <Shuffle className="mr-1 h-3 w-3" />
              Quick Pick
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            <span className="w-2 h-2 bg-primary/80 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
          </div>
        </div>
        
        <div className="p-6 lg:p-8 min-h-[1200px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">
              <span className="text-primary">01.</span> Pick 5 Numbers (1-70)
            </h3>
            <Badge variant="outline" className="lotto-number bg-black/30 border-primary/30 text-primary">
              {selectedNumbers.length}/5 Selected
            </Badge>
          </div>
          
          {renderNumberGrid()}
          
          <div className="flex items-center justify-between mb-4 mt-8">
            <h3 className="text-lg font-bold text-white">
              <span className="text-accent">02.</span> Pick 1 LOTTO Number (1-30)
            </h3>
            <Badge variant="outline" className="lotto-number bg-black/30 border-accent/30 text-accent">
              {selectedLottoNumber ? "1/1 Selected" : "0/1 Selected"}
            </Badge>
          </div>
          
          {renderLottoNumberGrid()}
          
          <div className="mb-8 mt-8">
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-bold text-white">
                <span className="text-primary">03.</span> Ticket Summary
              </h3>
            </div>
            
            {renderTicketSummary()}
          </div>
          
          {!isConnected ? (
            <Button
              onClick={() => setShowWalletModal(true)}
              className="btn-glow w-full bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-600 hover:to-primary text-black font-bold rounded-lg py-6 h-14 text-lg transition-all shadow-lg"
            >
              <Wallet className="mr-2 h-5 w-5" />
              Connect Wallet to Buy
            </Button>
          ) : (
            <Button
              onClick={handleBuyClick}
              disabled={
                isBuyingTickets || 
                !isDrawAvailable() ||
                isTimeRemainingZero()
              }
              className="btn-glow w-full bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-600 hover:to-primary text-black font-bold rounded-lg py-6 h-14 text-lg transition-all shadow-lg"
            >
              {isBuyingTickets ? 'Processing...' : `Buy ${tickets.length} Ticket${tickets.length > 1 ? 's' : ''} Now`}
            </Button>
          )}
        </div>
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
      />
    </div>
  );
};

export default ManualSelection;