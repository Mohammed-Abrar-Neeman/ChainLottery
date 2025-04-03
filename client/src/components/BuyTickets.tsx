import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, Shuffle, TicketIcon, RefreshCw } from 'lucide-react';
import WalletModal from './modals/WalletModal';
import BuyConfirmationModal from './modals/BuyConfirmationModal';
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

// Props interface for shared state
interface BuyTicketsProps {
  sharedSeriesIndex?: number;
  setSharedSeriesIndex?: Dispatch<SetStateAction<number | undefined>>;
  sharedDrawId?: number;
  setSharedDrawId?: Dispatch<SetStateAction<number | undefined>>;
}

export default function BuyTickets({
  sharedSeriesIndex,
  setSharedSeriesIndex,
  sharedDrawId,
  setSharedDrawId
}: BuyTicketsProps) {
  // State for selected numbers (5 main numbers + 1 LOTTO number)
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [selectedLottoNumber, setSelectedLottoNumber] = useState<number | null>(null);
  
  // UI states
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showBuyConfirmModal, setShowBuyConfirmModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  
  const { 
    lotteryData, 
    formatUSD, 
    buyCustomTicket,
    generateQuickPick, 
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
    getSelectedDrawTicketPrice
  } = useLotteryData();
  const { isConnected } = useWallet();
  const { toast } = useToast();
  
  // Using the enhanced check for draw availability from useLotteryData hook
  
  // Create a memoized function to get the current ticket price
  const getCurrentTicketPrice = React.useCallback(() => {
    const price = getSelectedDrawTicketPrice();
    console.log('BuyTickets - Getting current ticket price:', {
      price,
      selectedDrawId,
      sharedDrawId
    });
    return price;
  }, [getSelectedDrawTicketPrice, selectedDrawId, sharedDrawId]);
  
  // Get the current ticket price from the selected draw
  const rawTicketPrice = getCurrentTicketPrice();
  
  // Debug output for ticket price
  console.log('BuyTickets - Ticket Price:', {
    rawPrice: rawTicketPrice,
    parsedPrice: isDrawAvailable() ? parseFloat(rawTicketPrice || '0.01') : 0,
    selectedDrawId,
    sharedDrawId
  });
  
  // Parse ticket price from the selected draw
  const ticketPrice = isDrawAvailable() ? parseFloat(rawTicketPrice || '0.01') : 0;
  const networkFee = 0.0025; // Estimated gas fee in ETH
  const totalCost = ticketPrice + networkFee;
  
  // Sync local state with shared state when provided and generate a quick pick
  useEffect(() => {
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
    
    // Generate a quick pick when component mounts or shared values change
    if (!selectedNumbers.length) {
      handleQuickPick();
    }
  }, [sharedSeriesIndex, sharedDrawId]);
  
  // Force a re-render when selectedDrawId changes
  useEffect(() => {
    // This will trigger when either local or shared state changes the selectedDrawId
    console.log("BuyTickets - selectedDrawId changed, forcing update:", selectedDrawId);
    // The component will re-render and get the new ticket price
  }, [selectedDrawId]);

  // Generate a quick pick only when component first mounts
  useEffect(() => {
    handleQuickPick();
  }, []);
  
  // Handle number selection
  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else {
      if (selectedNumbers.length < 5) {
        setSelectedNumbers([...selectedNumbers, num]);
      }
    }
  };
  
  // Handle LOTTO number selection
  const toggleLottoNumber = (num: number) => {
    if (selectedLottoNumber === num) {
      setSelectedLottoNumber(null);
    } else {
      setSelectedLottoNumber(num);
    }
  };
  
  // Handle quick pick generation
  const handleQuickPick = () => {
    const { numbers, lottoNumber } = generateQuickPick();
    setSelectedNumbers(numbers);
    setSelectedLottoNumber(lottoNumber);
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
    
    // No need to manually update ticketPrice as it's now directly calculated from getSelectedDrawTicketPrice()
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
    
    setShowBuyConfirmModal(true);
  };
  
  // Handle confirm purchase
  const handleConfirmPurchase = async () => {
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
    
    setShowBuyConfirmModal(false);
    setShowPendingModal(true);
    
    // Pass the selected draw ID to the buyCustomTicket function
    const result = await buyCustomTicket(
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
      grid.push(
        <Button
          key={i}
          type="button"
          variant={selectedNumbers.includes(i) ? "default" : "outline"}
          onClick={() => toggleNumber(i)}
          className={`h-10 w-10 p-0 font-mono ${
            selectedNumbers.includes(i) 
              ? "bg-primary text-white" 
              : "bg-gray-100 hover:bg-gray-200"
          }`}
          disabled={selectedNumbers.length >= 5 && !selectedNumbers.includes(i)}
        >
          {i < 10 ? `0${i}` : i}
        </Button>
      );
    }
    return (
      <div className="grid grid-cols-10 gap-2 mb-6">
        {grid}
      </div>
    );
  };
  
  // Render LOTTO number selection grid (1-30)
  const renderLottoNumberGrid = () => {
    const grid = [];
    for (let i = 1; i <= 30; i++) {
      grid.push(
        <Button
          key={i}
          type="button"
          variant={selectedLottoNumber === i ? "default" : "outline"}
          onClick={() => toggleLottoNumber(i)}
          className={`h-10 w-10 p-0 font-mono ${
            selectedLottoNumber === i 
              ? "bg-accent text-white" 
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          {i < 10 ? `0${i}` : i}
        </Button>
      );
    }
    return (
      <div className="grid grid-cols-10 gap-2 mb-6">
        {grid}
      </div>
    );
  };
  
  return (
    <section id="buy-tickets" className="mb-16">
      <h2 className="text-2xl font-bold mb-6">Buy Tickets</h2>
      
      <div className="glass rounded-2xl shadow-glass p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Pick 5 Numbers (1-70)</h3>
              <Badge variant="outline" className="font-mono">
                {selectedNumbers.length}/5 Selected
              </Badge>
            </div>
            
            {renderNumberGrid()}
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Pick 1 LOTTO Number (1-30)</h3>
              <Badge variant="outline" className="font-mono">
                {selectedLottoNumber ? "1/1 Selected" : "0/1 Selected"}
              </Badge>
            </div>
            
            {renderLottoNumberGrid()}
            
            <div className="mb-6">
              <Button 
                onClick={handleQuickPick}
                variant="outline"
                className="w-full flex items-center justify-center"
              >
                <Shuffle className="mr-2 h-4 w-4" />
                Quick Pick
              </Button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Summary</h3>
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                {/* Draw information - Selected from Hero Banner */}
                <div className="mb-2 text-center">
                  <div className="text-sm text-gray-600 mb-1">
                    {selectedSeriesIndex !== undefined && seriesList?.find(s => s.index === selectedSeriesIndex)?.name} 
                    {selectedDrawId ? ` - Draw #${selectedDrawId}` : ''}
                  </div>
                  <div className="text-xs text-gray-500">
                    (Change draw selection in the banner above)
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Numbers:</span>
                    <span className="font-mono">
                      {selectedNumbers.length > 0 
                        ? selectedNumbers.sort((a, b) => a - b).map(n => n < 10 ? `0${n}` : n).join(', ') 
                        : 'None selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your LOTTO Number:</span>
                    <span className="font-mono">
                      {selectedLottoNumber 
                        ? (selectedLottoNumber < 10 ? `0${selectedLottoNumber}` : selectedLottoNumber) 
                        : 'None selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ticket Price:</span>
                    <span className="font-mono">
                      {ticketPrice < 0.0001 ? ticketPrice.toFixed(6) : ticketPrice.toFixed(4)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network Fee (est.):</span>
                    <span className="font-mono">{networkFee.toFixed(4)} ETH</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-semibold">
                    <span>Total:</span>
                    <span className="font-mono">
                      {totalCost < 0.0001 ? totalCost.toFixed(6) : totalCost.toFixed(4)} ETH
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {!isConnected ? (
              <Button
                onClick={() => setShowWalletModal(true)}
                className="w-full bg-primary hover:bg-opacity-90 text-white font-semibold rounded-full py-4 transition flex items-center justify-center"
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
                  !isDrawAvailable()
                }
                className="w-full bg-primary hover:bg-opacity-90 text-white font-semibold rounded-full py-4 transition flex items-center justify-center"
              >
                {isBuyingTickets ? 'Processing...' : 'Buy Ticket'}
              </Button>
            )}
          </div>
          
          <div id="how-it-works" className="bg-secondary rounded-2xl p-6 text-white">
            <h3 className="font-semibold text-lg mb-4">How It Works</h3>
            
            <div className="space-y-4">
              <div className="flex">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center font-semibold mr-3">1</div>
                <div>
                  <p>Pick 5 numbers (1-70) + 1 LOTTO number (1-30)</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center font-semibold mr-3">2</div>
                <div>
                  <p>Wait for the lottery draw to complete</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center font-semibold mr-3">3</div>
                <div>
                  <p>Match numbers to win prizes based on tier system</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center font-semibold mr-3">4</div>
                <div>
                  <p>Claim your prize if you win</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white border-opacity-20">
              <h4 className="text-sm font-semibold uppercase mb-2">Prize Tiers</h4>
              <ul className="text-sm space-y-1 text-white text-opacity-90">
                <li>• 5 + LOTTO: 100% of Jackpot</li>
                <li>• 5 Numbers: 1% of Jackpot</li>
                <li>• 4 + LOTTO: 0.01% of Jackpot</li>
                <li>• 4 Numbers: 0.001% of Jackpot</li>
                <li>• 3 + LOTTO: 0.0001% of Jackpot</li>
                <li>• 3 Numbers: 10 ETH</li>
                <li>• 2 + LOTTO: 8 ETH</li>
                <li>• 1 + LOTTO: 3 ETH</li>
                <li>• LOTTO only: 2 ETH</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <WalletModal 
        open={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />
      
      <BuyConfirmationModal
        open={showBuyConfirmModal}
        onClose={() => setShowBuyConfirmModal(false)}
        onConfirm={handleConfirmPurchase}
        ticketCount={1}
        ticketPrice={ticketPrice}
        totalTicketsPrice={ticketPrice}
        networkFee={networkFee}
        totalCost={totalCost}
        selectedNumbers={selectedNumbers}
        selectedLottoNumber={selectedLottoNumber}
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
}
