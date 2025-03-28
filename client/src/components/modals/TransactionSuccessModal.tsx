import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from 'wouter';
import { CheckCircle, ExternalLink } from 'lucide-react';
import { useLotteryData } from '@/hooks/useLotteryData';

interface TransactionSuccessModalProps {
  open: boolean;
  onClose: () => void;
  ticketCount: number;
  totalCost: number;
  transactionHash: string;
}

export default function TransactionSuccessModal({
  open,
  onClose,
  ticketCount,
  totalCost,
  transactionHash
}: TransactionSuccessModalProps) {
  const [, setLocation] = useLocation();
  const { formatUSD } = useLotteryData();
  
  const handleViewTickets = () => {
    onClose();
    setLocation('/tickets');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="glass rounded-2xl shadow-glass max-w-md w-full text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold">Transaction Successful!</h3>
          <p className="text-gray-600 mt-2">Your tickets have been purchased successfully.</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Tickets Purchased:</span>
            <span className="font-mono font-semibold">{ticketCount}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Total Paid:</span>
            <span className="font-mono">{totalCost.toFixed(4)} ETH</span>
          </div>
          <div className="text-right text-sm text-gray-500 mb-2">
            ≈ {formatUSD(totalCost.toString())}
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Transaction Hash:</span>
            <a 
              href={`https://etherscan.io/tx/${transactionHash}`}
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:text-accent transition font-mono text-sm truncate max-w-[200px] flex items-center"
            >
              {transactionHash.substring(0, 6)}...{transactionHash.substring(transactionHash.length - 4)}
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 mb-6">
          <p>
            Good luck! The lottery results will be announced when the current round ends. 
            You can view your tickets in the "My Tickets" section.
          </p>
        </div>
        
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-1/2 border border-gray-300 text-gray-700 font-semibold rounded-full py-3 transition hover:bg-gray-50"
          >
            Close
          </Button>
          <Button
            onClick={handleViewTickets}
            className="w-1/2 bg-primary hover:bg-opacity-90 text-white font-semibold rounded-full py-3 transition"
          >
            View My Tickets
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
