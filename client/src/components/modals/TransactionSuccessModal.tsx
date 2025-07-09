import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, TicketIcon, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatEther } from 'viem';
import { useLocation } from 'wouter';

interface Ticket {
  id: string;
  numbers: number[];
  lottoNumber: number | null;
  seriesIndex?: number;
  drawId?: number;
}

interface TransactionSuccessModalProps {
  open: boolean;
  onClose: () => void;
  transactionHash: string;
  ticketCount: number;
  tickets: Ticket[];
  totalCost: number;
  drawId?: number;
  seriesIndex?: number;
}

export default function TransactionSuccessModal({
  open,
  onClose,
  transactionHash,
  ticketCount,
  tickets,
  totalCost,
  drawId,
  seriesIndex
}: TransactionSuccessModalProps) {
  const [, setLocation] = useLocation();
  const hasMultipleTickets = tickets.length > 1;

  // Handle view tickets click
  const handleViewTickets = () => {
    if (tickets.length > 0 && typeof tickets[0].seriesIndex === 'number' && typeof tickets[0].drawId === 'number') {
      setLocation(`/my-tickets?seriesIndex=${tickets[0].seriesIndex}&drawId=${tickets[0].drawId}`);
    } else {
      setLocation('/my-tickets');
    }
    onClose();
  };

  // Format POL values
  const formatETH = (value: number) => {
    return value < 0.0001 ? value.toFixed(6) : value.toFixed(4);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="glass rounded-2xl shadow-glass max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Purchase Successful!
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          
          {/* Transaction Details */}
          <div className="bg-black/20 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Transaction Hash:</span>
              <a 
                href={`https://testnet.bscscan.com/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 flex items-center gap-1"
              >
                {transactionHash.slice(0, 6)}...{transactionHash.slice(-4)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Total Amount:</span>
              <span className="text-white">{formatETH(totalCost)} POL</span>
            </div>
          </div>
          
          {/* Ticket Summary */}
          <div className="bg-black/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TicketIcon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-white">
                {hasMultipleTickets ? `Your Tickets (${tickets.length})` : 'Your Ticket'}
              </h3>
            </div>
            {tickets.length === 0 ? (
              <div className="text-center text-white/60 py-4">No tickets to display.</div>
            ) : hasMultipleTickets ? (
              <ScrollArea className="h-40 pr-4">
                <div className="space-y-2">
                  {tickets.map((ticket, index) => (
                    <div key={ticket.id} className="bg-black/30 rounded p-2 border border-primary/20">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-white/70">Ticket #{index + 1}</span>
                        <div className="flex gap-1">
                          {Array.isArray(ticket.numbers) ? ticket.numbers.map((num) => (
                            <Badge 
                              key={num} 
                              variant="default"
                              className="bg-primary/20 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs lotto-number"
                            >
                              {num < 10 ? `0${num}` : num}
                            </Badge>
                          )) : []}
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
                  {Array.isArray(tickets[0]?.numbers) ? tickets[0].numbers.map((num) => (
                    <Badge 
                      key={num} 
                      variant="default"
                      className="bg-primary/20 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs lotto-number"
                    >
                      {num < 10 ? `0${num}` : num}
                    </Badge>
                  )) : []}
                  <Badge 
                    variant="default"
                    className="bg-accent/20 text-accent h-5 w-5 rounded-full flex items-center justify-center text-xs lotto-number"
                  >
                    {tickets[0]?.lottoNumber && (tickets[0]?.lottoNumber < 10 ? `0${tickets[0]?.lottoNumber}` : tickets[0]?.lottoNumber)}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button
            variant="outline" 
            onClick={onClose}
            className="w-1/2 border-primary/20 text-white hover:bg-primary/10 font-semibold rounded-lg py-2 transition"
          >
            Close
          </Button>
          <Button
            onClick={handleViewTickets}
            className="w-1/2 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg py-2 transition"
          >
            View My Tickets
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
