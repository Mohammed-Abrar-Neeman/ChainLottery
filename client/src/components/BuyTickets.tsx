import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Shuffle, Plus, Calendar } from 'lucide-react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useToast } from '@/hooks/use-toast';
import { useLotteryContract } from '@/hooks/useLotteryContract';
import { NumberSelectionGrid } from './NumberSelectionGrid';
import BuyConfirmationModal from './modals/BuyConfirmationModal';
import TransactionPendingModal from './modals/TransactionPendingModal';
import TransactionSuccessModal from './modals/TransactionSuccessModal';
import WalletModal from './modals/WalletModal';

// Stable default numbers for non-connected state
const DEFAULT_SELECTED_NUMBERS = [7, 14, 21, 42, 63];
const DEFAULT_LOTTO_NUMBER = 17;
const NETWORK_FEE = 0.0025;

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
  // State for selected numbers (5 main numbers + 1 LOTTO number)
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>(DEFAULT_SELECTED_NUMBERS);
  const [selectedLottoNumber, setSelectedLottoNumber] = useState<number | null>(DEFAULT_LOTTO_NUMBER);
  
  // Multiple ticket system - each ticket has unique numbers
  const [tickets, setTickets] = useState<Array<{id: string, numbers: number[], lottoNumber: number | null}>>([
    {id: `ticket-${Date.now()}`, numbers: [...DEFAULT_SELECTED_NUMBERS], lottoNumber: DEFAULT_LOTTO_NUMBER}
  ]);
  const [activeTicketIndex, setActiveTicketIndex] = useState(0);
  
  // UI states
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showBuyConfirmModal, setShowBuyConfirmModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [ticketPrice, setTicketPrice] = useState(0);
  const [gridKey, setGridKey] = useState(0);
  
  // Buy transaction states
  const [isBuying, setIsBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  
  const { isConnected } = useAppKitAccount();
  const { toast } = useToast();
  const { 
    generateQuickPick,
    buyTicket,
    getLotteryData,
    getTicketPrice
  } = useLotteryContract();
  
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
  
  // Use completely stable values when wallet is not connected to prevent flickering
  const networkFee = NETWORK_FEE;
  const totalTicketsCount = tickets.length;
  const totalTicketsPrice = ticketPrice * totalTicketsCount;
  const totalCost = totalTicketsPrice + networkFee;
  
  // Create stable series and draw name for non-connected state
  const stableSeriesName = "Beginner Series";
  const stableDrawId = 1;
  
  // Add a new ticket to the list
  const addNewTicket = () => {
    const quickPick = generateQuickPick(); // Generate new numbers for the new ticket
    const newTicketId = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setTickets(prev => [...prev, { 
      id: newTicketId, 
      numbers: quickPick.numbers,
      lottoNumber: quickPick.lottoNumber
    }]);
    setActiveTicketIndex(tickets.length);
    
    // Update selected numbers to match the new ticket
    setSelectedNumbers(quickPick.numbers);
    setSelectedLottoNumber(quickPick.lottoNumber);
    setGridKey(prev => prev + 1);
  };
  
  // Remove a ticket from the list
  const removeTicket = (index: number) => {
    if (tickets.length <= 1) {
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
    
    if (index <= activeTicketIndex) {
      setActiveTicketIndex(Math.max(0, activeTicketIndex - 1));
    }
  };
  
  // Handle ticket tab click
  const handleTicketSelect = (index: number) => {
    setActiveTicketIndex(index);
    // Update selected numbers to match the selected ticket
    setSelectedNumbers(tickets[index].numbers);
    setSelectedLottoNumber(tickets[index].lottoNumber);
    setGridKey(prev => prev + 1);
  };
  
  // Handle quick pick generation
  const handleQuickPick = useCallback(() => {
    const quickPick = generateQuickPick();
    setSelectedNumbers(quickPick.numbers);
    setSelectedLottoNumber(quickPick.lottoNumber);
    setGridKey(prev => prev + 1);
    
    // Update active ticket
    setTickets(prev => {
      const newTickets = [...prev];
      newTickets[activeTicketIndex] = {
        ...newTickets[activeTicketIndex],
        numbers: quickPick.numbers,
        lottoNumber: quickPick.lottoNumber
      };
      return newTickets;
    });
  }, [generateQuickPick, activeTicketIndex]);
  
  // Handle number selection
  const handleNumbersSelected = useCallback((numbers: number[], lottoNumber: number | null) => {
    setSelectedNumbers(numbers);
    setSelectedLottoNumber(lottoNumber);
    
    // Update active ticket
    setTickets(prev => {
      const newTickets = [...prev];
      newTickets[activeTicketIndex] = {
        ...newTickets[activeTicketIndex],
        numbers,
        lottoNumber
      };
      return newTickets;
    });
  }, [activeTicketIndex]);
  
  // Handle buy click
  const handleBuyClick = async () => {
    if (!isConnected) {
      setShowWalletModal(true);
      return;
    }
    
    if (selectedNumbers.length !== 5 || selectedLottoNumber === null) {
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
    if (selectedNumbers.length !== 5 || selectedLottoNumber === null) {
      return;
    }
    
    setShowBuyConfirmModal(false);
    setShowPendingModal(true);
    setIsBuying(true);
    setBuyError(null);
    
    // Buy tickets
    const buyTickets = async () => {
      try {
        // Buy single ticket
        const result = await buyTicket(
          selectedNumbers,
          selectedLottoNumber,
          sharedSeriesIndex ?? 0,
          sharedDrawId ?? 0
        );
        
        if (result.success && result.txHash) {
          setTransactionHash(result.txHash);
          setShowPendingModal(false);
          setShowSuccessModal(true);
          
          // Reset to a single ticket after successful purchase
          setTickets([{
            id: `ticket-${Date.now()}`, 
            numbers: [...DEFAULT_SELECTED_NUMBERS], 
            lottoNumber: DEFAULT_LOTTO_NUMBER
          }]);
          setActiveTicketIndex(0);
          
          // Show success toast
          toast({
            title: "Success!",
            description: "Your ticket has been purchased successfully.",
            variant: "default"
          });
        } else {
          throw new Error(result.error || 'Failed to buy ticket');
        }
      } catch (error) {
        console.error('Error buying tickets:', error);
        setBuyError(error instanceof Error ? error.message : 'Failed to buy tickets');
        setShowPendingModal(false);
        toast({
          title: "Purchase Failed",
          description: error instanceof Error ? error.message : "Failed to buy tickets. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsBuying(false);
      }
    };
    
    buyTickets();
  };
  
  // Handle modal close
  const handleModalClose = () => {
    setShowBuyConfirmModal(false);
    setShowPendingModal(false);
    setShowSuccessModal(false);
    setBuyError(null);
  };
  
  // Render ticket summary section
  const renderTicketSummary = () => {
    return (
      <div className="bg-black/30 border border-primary/20 rounded-lg p-5 space-y-4">
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
                  disabled={tickets.length >= 20}
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
                <span className="text-white/70">Selected Numbers:</span>
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

          {/* Price Summary */}
          <div className="bg-black/20 rounded-md p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-white/70">Ticket Price:</span>
              <span className="crypto-value text-white">
                {isConnected ? `${ticketPrice.toFixed(5)} ETH` : "Connect wallet to see price"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Number of Tickets:</span>
              <span className="text-white font-medium">{totalTicketsCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Total Tickets Price:</span>
              <span className="crypto-value text-white">
                {isConnected ? `${totalTicketsPrice.toFixed(5)} ETH` : "Connect wallet to see price"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Network Fee:</span>
              <span className="crypto-value text-white">
                {networkFee.toFixed(5)} ETH
              </span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t border-white/10">
              <span className="text-white">Total Cost:</span>
              <span className="crypto-value text-white">
                {isConnected ? `${totalCost.toFixed(5)} ETH` : "Connect wallet to see price"}
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
                key={gridKey}
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
                onClick={() => setShowWalletModal(true)}
                className="btn-glow w-full bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-600 hover:to-primary text-black font-bold rounded-lg py-5 h-14 text-lg transition-all shadow-lg"
              >
                <Wallet className="mr-2 h-5 w-5" />
                Connect Wallet to Buy
              </Button>
            ) : (
              <Button
                onClick={handleBuyClick}
                disabled={selectedNumbers.length !== 5 || selectedLottoNumber === null}
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
      
      {/* Modals */}
      <WalletModal
        open={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
      
      <BuyConfirmationModal
        open={showBuyConfirmModal}
        onClose={handleModalClose}
        onConfirm={handleInitialConfirm}
        ticketPrice={ticketPrice}
        totalTicketsPrice={totalTicketsPrice}
        networkFee={networkFee}
        totalCost={totalCost}
        selectedNumbers={selectedNumbers}
        selectedLottoNumber={selectedLottoNumber}
        tickets={tickets}
        isConnected={isConnected}
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
        ticketCount={tickets.length}
        tickets={tickets}
        totalCost={totalCost}
        selectedNumbers={selectedNumbers}
        selectedLottoNumber={selectedLottoNumber}
        drawId={sharedDrawId}
        seriesIndex={sharedSeriesIndex}
      />
    </section>
  );
});

export default BuyTickets;
