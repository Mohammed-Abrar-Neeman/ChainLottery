import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from 'wouter';
import { CheckCircle, ExternalLink, TicketIcon } from 'lucide-react';
import { useLotteryData } from '@/hooks/useLotteryData';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Ticket {
  id: string;
  numbers: number[];
  lottoNumber: number | null;
}

interface TransactionSuccessModalProps {
  open: boolean;
  onClose: () => void;
  ticketCount: number;
  tickets?: Ticket[];
  totalCost: number;
  transactionHash: string;
  selectedNumbers?: number[];
  selectedLottoNumber?: number | null;
}

export default function TransactionSuccessModal({
  open,
  onClose,
  ticketCount,
  tickets = [],
  totalCost,
  transactionHash,
  selectedNumbers = [],
  selectedLottoNumber = null
}: TransactionSuccessModalProps) {
  const [, setLocation] = useLocation();
  const { formatUSD } = useLotteryData();
  const hasMultipleTickets = tickets.length > 0;
  
  const handleViewTickets = () => {
    onClose();
    setLocation('/tickets');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="glass rounded-2xl shadow-glass max-w-md w-full max-h-[90vh] overflow-y-auto text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold">Transaction Successful!</h3>
          <p className="text-gray-600 mt-2">
            {ticketCount > 1 
              ? `Your ${ticketCount} lottery tickets have been purchased successfully.`
              : 'Your lottery ticket has been purchased successfully.'
            }
          </p>
        </div>
        
        {/* Display tickets */}
        {hasMultipleTickets ? (
          // Multiple tickets view
          <div className="bg-gray-100 rounded-lg p-4 mb-4 border border-gray-200 text-left">
            <div className="flex items-center gap-2 mb-3">
              <TicketIcon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Your Lottery Tickets ({tickets.length})</h3>
            </div>
            
            <ScrollArea className="h-60 pr-4">
              <div className="space-y-3">
                {tickets.map((ticket, index) => (
                  <div key={ticket.id} className="bg-white/80 rounded p-3 border border-gray-200">
                    <div className="text-sm font-medium mb-2">Ticket #{index + 1}</div>
                    
                    <div className="mb-2">
                      <div className="text-xs text-gray-600 mb-1">Main Numbers:</div>
                      <div className="flex gap-1 flex-wrap">
                        {ticket.numbers.sort((a, b) => a - b).map((num) => (
                          <Badge 
                            key={num} 
                            variant="default"
                            className="bg-primary text-white h-6 w-6 rounded-full flex items-center justify-center text-xs lotto-number"
                          >
                            {num < 10 ? `0${num}` : num}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-600 mb-1">LOTTO Number:</div>
                      <div className="flex">
                        {ticket.lottoNumber && (
                          <Badge 
                            variant="default"
                            className="bg-accent text-white h-6 w-6 rounded-full flex items-center justify-center text-xs lotto-number"
                          >
                            {ticket.lottoNumber < 10 ? `0${ticket.lottoNumber}` : ticket.lottoNumber}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : selectedNumbers.length > 0 && (
          // Single ticket view (legacy support)
          <div className="bg-gray-100 rounded-lg p-4 mb-4 border border-gray-200 text-left">
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
                    className="bg-primary text-white h-8 w-8 rounded-full flex items-center justify-center lotto-number"
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
                    className="bg-accent text-white h-8 w-8 rounded-full flex items-center justify-center lotto-number"
                  >
                    {selectedLottoNumber < 10 ? `0${selectedLottoNumber}` : selectedLottoNumber}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Tickets Purchased:</span>
            <span className="lotto-number">{ticketCount}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Total Paid:</span>
            <span className="crypto-value">
              {totalCost < 0.0001 ? totalCost.toFixed(6) : totalCost.toFixed(4)} ETH
            </span>
          </div>
          <div className="text-right text-sm text-gray-500 mb-2">
            ≈ {formatUSD(totalCost.toString())}
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Transaction Hash:</span>
            <a 
              href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
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
            Good luck! The lottery results will be announced when the current draw ends. 
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
