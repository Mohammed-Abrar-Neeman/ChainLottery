import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { useLotteryData } from '@/hooks/useLotteryData';

interface BuyConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  ticketCount: number;
  ticketPrice: number;
  totalTicketsPrice: number;
  networkFee: number;
  totalCost: number;
}

export default function BuyConfirmationModal({
  open,
  onClose,
  onConfirm,
  ticketCount,
  ticketPrice,
  totalTicketsPrice,
  networkFee,
  totalCost
}: BuyConfirmationModalProps) {
  const { formatUSD } = useLotteryData();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="glass rounded-2xl shadow-glass max-w-md w-full">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-xl font-bold">Confirm Purchase</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>
        
        <div className="mb-6 mt-4">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Tickets:</span>
              <span className="font-mono font-semibold">{ticketCount}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Price per ticket:</span>
              <span className="font-mono">{ticketPrice.toFixed(4)} ETH</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Total price:</span>
              <span className="font-mono">{totalTicketsPrice.toFixed(4)} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Network fee (est.):</span>
              <span className="font-mono">{networkFee.toFixed(4)} ETH</span>
            </div>
            <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-semibold">
              <span>Total:</span>
              <span className="font-mono">{totalCost.toFixed(4)} ETH</span>
            </div>
            <div className="text-right text-sm text-gray-500 mt-1">
              ≈ {formatUSD(totalCost.toString())}
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-6">
            <p>
              By confirming this transaction, you are purchasing lottery tickets for the current round. 
              Your transaction will be processed on the Ethereum network and cannot be reversed.
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button
            variant="outline" 
            onClick={onClose}
            className="w-1/2 border border-gray-300 text-gray-700 font-semibold rounded-full py-3 transition hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="w-1/2 bg-primary hover:bg-opacity-90 text-white font-semibold rounded-full py-3 transition flex items-center justify-center"
          >
            <span>Confirm</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
