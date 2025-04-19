import React, { useState, useEffect, Dispatch, SetStateAction, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, Shuffle, TicketIcon, RefreshCw } from 'lucide-react';
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
  
  const { 
    lotteryData, 
    formatUSD, 
    buyCustomTicket: buyTicket,
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
  const { toast } = useToast();
  
  // Create a function to get the current ticket price
  const getCurrentTicketPrice = () => {
    const price = getSelectedDrawTicketPrice();
    console.log('BuyTickets - Getting current ticket price:', {
      price,
      selectedDrawId,
      sharedDrawId
    });
    return price;
  };
  
  // Get the current ticket price from the selected draw
  const rawTicketPrice = getCurrentTicketPrice();
  
  // Debug output for ticket price
  console.log('BuyTickets - Ticket Price:', {
    rawPrice: rawTicketPrice,
    parsedPrice: isDrawAvailable() ? parseFloat(rawTicketPrice || '0.01') : 0,
    selectedDrawId,
    sharedDrawId
  });
  
  // Use completely stable values when wallet is not connected to prevent flickering
  // This is the key to preventing flickering - we bypass all the data fetching processes when not connected
  const ticketPrice = !isConnected ? STABLE_TICKET_PRICE : (isDrawAvailable() ? parseFloat(rawTicketPrice || '0.01') : 0);
  const networkFee = NETWORK_FEE; // Estimated gas fee in ETH
  const totalCost = ticketPrice + networkFee;
  
  // Create stable series and draw name for non-connected state
  const stableSeriesName = "Beginner Series";
  const stableDrawId = 1;
  
  // Sync local state with shared state when provided and connected
  useEffect(() => {
    if (!isConnected) return; // Skip syncing when wallet is not connected to prevent flickering
    
    // If sharedSeriesIndex is provided, update local state
    if (sharedSeriesIndex !== undefined && sharedSeriesIndex !== selectedSeriesIndex) {
      console.log("BuyTickets - Updating series index from shared state:", 
        { old: selectedSeriesIndex, new: sharedSeriesIndex });
      setSelectedSeriesIndex(sharedSeriesIndex);
    }
    
    // If sharedDrawId is provided, update local state
    if (sharedDrawId !== undefined && sharedDrawId !== selectedDrawId) {
      console.log("BuyTickets - Updating draw ID from shared state:", 
        { old: selectedDrawId, new: sharedDrawId });
      setSelectedDrawId(sharedDrawId);
    }
  }, [isConnected, sharedSeriesIndex, sharedDrawId, selectedSeriesIndex, selectedDrawId, setSelectedSeriesIndex, setSelectedDrawId]);
  
  // Force a re-render when selectedDrawId changes
  useEffect(() => {
    // This will trigger when either local or shared state changes the selectedDrawId
    console.log("BuyTickets - selectedDrawId changed, forcing update:", selectedDrawId);
    // The component will re-render and get the new ticket price
  }, [selectedDrawId]);

  // Handle quick pick generation
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
  
  // Handle final confirmation and purchase
  const handleConfirmPurchase = async () => {
    if (selectedNumbers.length !== 5 || selectedLottoNumber === null) {
      return;
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
    
    // Pass the selected draw ID to the buyCustomTicket function
    const result = await buyTicket(
      selectedNumbers, 
      selectedLottoNumber,
      selectedSeriesIndex,
      selectedDrawId
    );
    
    setShowPendingModal(false);
    
    if (result.success && result.txHash) {
      setTransactionHash(result.txHash);
      setShowSuccessModal(true);
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
          className={`h-10 w-10 p-0 font-mono relative transition-all ${
            isSelected 
              ? "bg-primary text-black font-bold scale-110 shadow-md animate-glow" 
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
          className={`h-10 w-10 p-0 font-mono relative transition-all ${
            isSelected 
              ? "bg-accent text-black font-bold scale-110 shadow-md animate-glow" 
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
            {!isConnected 
              ? `${stableSeriesName} - Draw #${stableDrawId}` 
              : `${displaySeriesName}${displayDrawId ? ` - Draw #${displayDrawId}` : ''}`
            }
          </div>
          <div className="text-xs text-white/50">
            {isConnected ? "(Change draw selection in the banner above)" : "(Connect wallet to select draw)"}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/70">Your Numbers:</span>
            <span className="font-mono text-primary font-medium">
              {selectedNumbers.length > 0 
                ? selectedNumbers.sort((a, b) => a - b).map(n => n < 10 ? `0${n}` : n).join(', ') 
                : 'None selected'}
            </span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/70">Your LOTTO Number:</span>
            <span className="font-mono text-accent font-medium">
              {selectedLottoNumber 
                ? (selectedLottoNumber < 10 ? `0${selectedLottoNumber}` : selectedLottoNumber) 
                : 'None selected'}
            </span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/70">Ticket Price:</span>
            <span className="font-mono text-white">
              {ticketPrice.toFixed(4)} ETH
            </span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/70">Network Fee (est.):</span>
            <span className="font-mono text-white">{networkFee.toFixed(4)} ETH</span>
          </div>
          <div className="pt-2 mt-1 flex justify-between font-bold">
            <span className="text-white">Total:</span>
            <span className="font-mono text-primary text-lg">
              {totalCost.toFixed(4)} ETH
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
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center font-bold mr-4 text-primary">
              1
            </div>
            <div>
              <p className="text-white font-medium">Choose 5 numbers from 1-70 and 1 LOTTO number from 1-30</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center font-bold mr-4 text-primary">
              2
            </div>
            <div>
              <p className="text-white font-medium">Purchase your ticket using ETH</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center font-bold mr-4 text-primary">
              3
            </div>
            <div>
              <p className="text-white font-medium">Wait for the lottery draw to complete</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center font-bold mr-4 text-primary">
              4
            </div>
            <div>
              <p className="text-white font-medium">Matching numbers win prizes automatically</p>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10 rounded-xl blur-sm"></div>
              <div className="relative bg-black/40 backdrop-blur-sm border border-primary/20 rounded-lg p-4">
                <h4 className="text-sm font-bold uppercase mb-3 text-primary">Prize Tiers</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-white/90">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                    <span>5 + LOTTO: 100% Jackpot</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                    <span>5 Numbers: 1% Jackpot</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                    <span>4 + LOTTO: 0.01% Jackpot</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                    <span>4 Numbers: 0.001% Jackpot</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                    <span>3 + LOTTO: 0.0001% Jackpot</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                    <span>3 Numbers: 10 ETH</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                    <span>2 + LOTTO: 8 ETH</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                    <span>1 + LOTTO: 3 ETH</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                    <span>LOTTO only: 2 ETH</span>
                  </div>
                </div>
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
      
      <div className="casino-card overflow-hidden">
        <div className="casino-card-header flex items-center justify-between py-4 px-6">
          <div className="text-sm uppercase tracking-widest font-bold text-primary">Choose Your Lottery Numbers</div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            <span className="w-2 h-2 bg-primary/80 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 lg:p-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                <span className="text-primary">01.</span> Pick 5 Numbers (1-70)
              </h3>
              <Badge variant="outline" className="font-mono bg-black/30 border-primary/30 text-primary">
                {selectedNumbers.length}/5 Selected
              </Badge>
            </div>
            
            {renderNumberGrid()}
            
            <div className="flex items-center justify-between mb-4 mt-8">
              <h3 className="text-lg font-bold text-white">
                <span className="text-accent">02.</span> Pick 1 LOTTO Number (1-30)
              </h3>
              <Badge variant="outline" className="font-mono bg-black/30 border-accent/30 text-accent">
                {selectedLottoNumber ? "1/1 Selected" : "0/1 Selected"}
              </Badge>
            </div>
            
            {renderLottoNumberGrid()}
            
            <div className="mb-8 mt-6">
              <Button 
                onClick={handleQuickPick}
                variant="outline"
                className="w-full flex items-center justify-center border-primary/30 text-primary hover:bg-primary/10 hover:border-primary py-6 h-12"
              >
                <Shuffle className="mr-2 h-5 w-5" />
                Quick Pick
              </Button>
            </div>
            
            <div className="mb-8">
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
                  selectedNumbers.length !== 5 || 
                  selectedLottoNumber === null ||
                  !isDrawAvailable() ||
                  isTimeRemainingZero()
                }
                className="btn-glow w-full bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-600 hover:to-primary text-black font-bold rounded-lg py-6 h-14 text-lg transition-all shadow-lg"
              >
                {isBuyingTickets ? 'Processing...' : 'Buy Ticket Now'}
              </Button>
            )}
          </div>
          
          {renderHowItWorks()}
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
        ticketCount={1}
        ticketPrice={ticketPrice}
        totalTicketsPrice={ticketPrice}
        networkFee={networkFee}
        totalCost={totalCost}
        selectedNumbers={selectedNumbers}
        selectedLottoNumber={selectedLottoNumber}
      />
      
      <TicketReconfirmationModal
        open={showReconfirmModal}
        onClose={() => setShowReconfirmModal(false)}
        onConfirm={handleConfirmPurchase}
        ticketCount={1}
        ticketPrice={ticketPrice}
        totalTicketsPrice={ticketPrice}
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
        ticketCount={1}
        totalCost={totalCost}
        transactionHash={transactionHash}
        selectedNumbers={selectedNumbers}
        selectedLottoNumber={selectedLottoNumber}
      />
    </section>
  );
});

export default BuyTickets;