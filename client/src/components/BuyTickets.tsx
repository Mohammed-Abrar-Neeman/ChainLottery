import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useWallet } from '@/hooks/useWallet';
import { Minus, Plus, Wallet, ExternalLink } from 'lucide-react';
import WalletModal from './modals/WalletModal';
import BuyConfirmationModal from './modals/BuyConfirmationModal';
import TransactionPendingModal from './modals/TransactionPendingModal';
import TransactionSuccessModal from './modals/TransactionSuccessModal';

export default function BuyTickets() {
  const [ticketCount, setTicketCount] = useState(1);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showBuyConfirmModal, setShowBuyConfirmModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  
  const { lotteryData, formatUSD, buyTickets, isBuyingTickets } = useLotteryData();
  const { isConnected } = useWallet();
  
  const ticketPrice = parseFloat(lotteryData?.ticketPrice || '0.01');
  const networkFee = 0.0025; // Estimated gas fee in ETH
  
  const incrementTickets = () => {
    if (ticketCount < 100) {
      setTicketCount(ticketCount + 1);
    }
  };
  
  const decrementTickets = () => {
    if (ticketCount > 1) {
      setTicketCount(ticketCount - 1);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      if (value > 100) {
        setTicketCount(100);
      } else if (value < 1) {
        setTicketCount(1);
      } else {
        setTicketCount(value);
      }
    }
  };
  
  const handleBuyClick = () => {
    if (!isConnected) {
      setShowWalletModal(true);
    } else {
      setShowBuyConfirmModal(true);
    }
  };
  
  const handleConfirmPurchase = async () => {
    setShowBuyConfirmModal(false);
    setShowPendingModal(true);
    
    const result = await buyTickets(ticketCount);
    
    setShowPendingModal(false);
    
    if (result.success && result.txHash) {
      setTransactionHash(result.txHash);
      setShowSuccessModal(true);
    }
  };
  
  const totalTicketsPrice = ticketPrice * ticketCount;
  const totalCost = totalTicketsPrice + networkFee;
  
  return (
    <section id="buy-tickets" className="mb-16">
      <h2 className="text-2xl font-bold mb-6">Buy Tickets</h2>
      
      <div className="glass rounded-2xl shadow-glass p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <label className="block text-gray-700 font-medium mb-2">Number of Tickets</label>
              <div className="flex items-center mb-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={decrementTickets}
                  className="h-12 w-12 rounded-l-lg bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={ticketCount}
                  onChange={handleInputChange}
                  min={1}
                  max={100}
                  className="h-12 w-full border-y border-gray-200 font-mono text-center text-xl rounded-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={incrementTickets}
                  className="h-12 w-12 rounded-r-lg bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600 mb-8">
                <span>Min: 1 ticket</span>
                <span>Max: 100 tickets per transaction</span>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Summary</h3>
              <div className="border border-gray-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ticket Price:</span>
                  <span className="font-mono">{ticketPrice.toFixed(4)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Number of Tickets:</span>
                  <span className="font-mono">{ticketCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Network Fee (est.):</span>
                  <span className="font-mono">{networkFee.toFixed(4)} ETH</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="font-mono">{totalCost.toFixed(4)} ETH</span>
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
                disabled={isBuyingTickets}
                className="w-full bg-primary hover:bg-opacity-90 text-white font-semibold rounded-full py-4 transition flex items-center justify-center"
              >
                {isBuyingTickets ? 'Processing...' : 'Buy Tickets'}
              </Button>
            )}
          </div>
          
          <div className="bg-secondary rounded-2xl p-6 text-white">
            <h3 className="font-semibold text-lg mb-4">How It Works</h3>
            
            <div className="space-y-4">
              <div className="flex">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center font-semibold mr-3">1</div>
                <div>
                  <p>Buy as many tickets as you want (1-100 per transaction)</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center font-semibold mr-3">2</div>
                <div>
                  <p>Wait for the lottery round to end (~24 hours)</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center font-semibold mr-3">3</div>
                <div>
                  <p>If you win, the prize is automatically sent to your wallet</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center font-semibold mr-3">4</div>
                <div>
                  <p>Winner selection is verifiably random using ChainLink VRF</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white border-opacity-20">
              <h4 className="text-sm font-semibold uppercase mb-2">Prize Distribution</h4>
              <div className="flex items-center mb-2">
                <div className="w-full bg-white bg-opacity-10 rounded-full h-4 mr-2">
                  <div className="bg-accent h-4 rounded-full" style={{ width: '70%' }}></div>
                </div>
                <span className="text-sm font-mono">70%</span>
              </div>
              <p className="text-sm text-white text-opacity-70">
                70% to Winner, 20% to Next Lottery, 10% to Treasury
              </p>
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
        ticketCount={ticketCount}
        ticketPrice={ticketPrice}
        totalTicketsPrice={totalTicketsPrice}
        networkFee={networkFee}
        totalCost={totalCost}
      />
      
      <TransactionPendingModal
        open={showPendingModal}
        onClose={() => setShowPendingModal(false)}
        transactionHash={transactionHash}
      />
      
      <TransactionSuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        ticketCount={ticketCount}
        totalCost={totalCost}
        transactionHash={transactionHash}
      />
    </section>
  );
}
