import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, TicketIcon, AlertCircle } from 'lucide-react';
import { useAppKitAccount } from '@reown/appkit/react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatEther } from 'viem';

interface Ticket {
  id: string;
  numbers: number[];
  lottoNumber: number | null;
}

interface BuyConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  ticketPrice: number;
  totalTicketsPrice: number;
  totalCost: number;
  selectedNumbers: number[];
  selectedLottoNumber: number | null;
  tickets: Array<{id: string, numbers: number[], lottoNumber: number | null}>;
  isConnected: boolean;
}

export default function BuyConfirmationModal({
  open,
  onClose,
  onConfirm,
  ticketPrice,
  totalTicketsPrice,
  totalCost,
  selectedNumbers,
  selectedLottoNumber,
  tickets,
  isConnected
}: BuyConfirmationModalProps) {
  const { address } = useAppKitAccount();
  const hasMultipleTickets = tickets.length > 1;
  const ticketCount = hasMultipleTickets ? tickets.length : 1;

  // Format ETH values
  const formatETH = (value: number | undefined) => {
    if (value === undefined || value === null) return '0.0000';
    return value < 0.0001 ? value.toFixed(6) : value.toFixed(4);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="glass rounded-2xl shadow-glass max-w-md w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-xl font-bold">Confirm Purchase</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Ticket Summary */}
          <div className="bg-black/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TicketIcon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-white">
                {hasMultipleTickets ? `Your Tickets (${tickets.length})` : 'Your Ticket'}
              </h3>
            </div>
            
            {hasMultipleTickets ? (
              <ScrollArea className="h-40 pr-4">
                <div className="space-y-2">
                  {tickets.map((ticket, index) => (
                    <div key={ticket.id} className="bg-black/30 rounded p-2 border border-primary/20">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-white/70">Ticket #{index + 1}</span>
                        <div className="flex gap-1">
                          {ticket.numbers.sort((a, b) => a - b).map((num) => (
                            <Badge 
                              key={num} 
                              variant="default"
                              className="bg-primary/20 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs lotto-number"
                            >
                              {num < 10 ? `0${num}` : num}
                            </Badge>
                          ))}
                          <Badge 
                            variant="default"
                            className="bg-accent/20 text-accent h-5 w-5 rounded-full flex items-center justify-center text-xs lotto-number"
                          >
                            {ticket.lottoNumber && (ticket.lottoNumber < 10 ? `0${ticket.lottoNumber}` : ticket.lottoNumber)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-between bg-black/30 rounded p-2 border border-primary/20">
                <div className="flex gap-1">
                  {selectedNumbers.sort((a, b) => a - b).map((num) => (
                    <Badge 
                      key={num} 
                      variant="default"
                      className="bg-primary/20 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs lotto-number"
                    >
                      {num < 10 ? `0${num}` : num}
                    </Badge>
                  ))}
                  <Badge 
                    variant="default"
                    className="bg-accent/20 text-accent h-5 w-5 rounded-full flex items-center justify-center text-xs lotto-number"
                  >
                    {selectedLottoNumber && (selectedLottoNumber < 10 ? `0${selectedLottoNumber}` : selectedLottoNumber)}
                  </Badge>
                </div>
              </div>
            )}
          </div>
          
          {/* Price Summary */}
          <div className="bg-black/20 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Tickets:</span>
              <span className="text-white">{ticketCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Price per ticket:</span>
              <span className="text-white">
                {formatETH(ticketPrice)} ETH
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Total price:</span>
              <span className="text-white">
                {formatETH(totalTicketsPrice)} ETH
              </span>
            </div>
            <div className="border-t border-white/10 pt-2 mt-2 flex justify-between font-semibold">
              <span className="text-white">Total:</span>
              <div className="text-right">
                <div className="text-white">
                  {formatETH(totalCost)} ETH
                </div>
                <div className="text-xs text-white/50">
                  ≈ ${(totalCost * 3000).toFixed(2)} {/* Using a fixed rate for demo */}
                </div>
              </div>
            </div>
          </div>
          
          {/* Warning Message */}
          <div className="flex items-start gap-2 text-sm text-white/70 bg-black/20 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p>
              By confirming, you are purchasing {ticketCount > 1 ? `${ticketCount} lottery tickets` : 'a lottery ticket'} for the current draw. 
              This transaction cannot be reversed.
            </p>
          </div>
        </div>
        
        <div className="flex gap-4 mt-6">
          <Button
            variant="outline" 
            onClick={onClose}
            className="w-1/2 border-primary/20 text-white hover:bg-primary/10 font-semibold rounded-lg py-2 transition"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!isConnected || !address}
            className="w-1/2 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg py-2 transition"
          >
            Confirm Purchase
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
