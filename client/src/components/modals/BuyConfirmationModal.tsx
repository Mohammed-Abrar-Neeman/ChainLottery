import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, TicketIcon } from 'lucide-react';
import { useLotteryData } from '@/hooks/useLotteryData';
import { Badge } from '@/components/ui/badge';

interface BuyConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  ticketCount: number;
  ticketPrice: number;
  totalTicketsPrice: number;
  networkFee: number;
  totalCost: number;
  selectedNumbers?: number[];
  selectedLottoNumber?: number | null;
}

export default function BuyConfirmationModal({
  open,
  onClose,
  onConfirm,
  ticketCount,
  ticketPrice,
  totalTicketsPrice,
  networkFee,
  totalCost,
  selectedNumbers = [],
  selectedLottoNumber = null
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
          {/* Display ticket numbers if provided */}
          {selectedNumbers.length > 0 && (
            <div className="bg-gray-100 rounded-lg p-4 mb-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <TicketIcon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Your Lottery Ticket</h3>
              </div>
              
              <div className="mb-2">
                <div className="text-sm text-gray-600 mb-1">Main Numbers (5):</div>
                <div className="flex gap-2 flex-wrap">
                  {selectedNumbers.sort((a, b) => a - b).map((num) => (
                    <Badge 
                      key={num} 
                      variant="default"
                      className="bg-primary text-white h-8 w-8 rounded-full flex items-center justify-center font-mono"
                    >
                      {num < 10 ? `0${num}` : num}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">LOTTO Number (1):</div>
                <div className="flex">
                  {selectedLottoNumber && (
                    <Badge 
                      variant="default"
                      className="bg-accent text-white h-8 w-8 rounded-full flex items-center justify-center font-mono"
                    >
                      {selectedLottoNumber < 10 ? `0${selectedLottoNumber}` : selectedLottoNumber}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Tickets:</span>
              <span className="font-mono font-semibold">{ticketCount}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Price per ticket:</span>
              <span className="font-mono">
                {ticketPrice < 0.0001 ? ticketPrice.toFixed(6) : ticketPrice.toFixed(4)} ETH
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Total price:</span>
              <span className="font-mono">
                {totalTicketsPrice < 0.0001 ? totalTicketsPrice.toFixed(6) : totalTicketsPrice.toFixed(4)} ETH
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Network fee (est.):</span>
              <span className="font-mono">{networkFee.toFixed(4)} ETH</span>
            </div>
            <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-semibold">
              <span>Total:</span>
              <span className="font-mono">
                {totalCost < 0.0001 ? totalCost.toFixed(6) : totalCost.toFixed(4)} ETH
              </span>
            </div>
            <div className="text-right text-sm text-gray-500 mt-1">
              ≈ {formatUSD(totalCost.toString())}
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-6">
            <p>
              By confirming this transaction, you are purchasing a lottery ticket with your selected numbers
              for the current draw. Your transaction will be processed on the Ethereum network and cannot be reversed.
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
