import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, TicketIcon, AlertTriangle, CheckCircle } from 'lucide-react';
import { useLotteryData } from '@/hooks/useLotteryData';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Ticket {
  id: string;
  numbers: number[];
  lottoNumber: number | null;
}

interface TicketReconfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tickets?: Ticket[];
  ticketPrice: number;
  totalTicketsPrice: number;
  networkFee: number;
  totalCost: number;
  selectedNumbers?: number[];
  selectedLottoNumber?: number | null;
  seriesName?: string;
  drawId?: number;
}

export default function TicketReconfirmationModal({
  open,
  onClose,
  onConfirm,
  tickets = [],
  ticketPrice,
  totalTicketsPrice,
  networkFee,
  totalCost,
  selectedNumbers = [],
  selectedLottoNumber = null,
  seriesName = "",
  drawId
}: TicketReconfirmationModalProps) {
  const { formatUSD } = useLotteryData();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const hasMultipleTickets = tickets.length > 0;
  const ticketCount = hasMultipleTickets ? tickets.length : 1;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="glass rounded-2xl shadow-glass max-w-md w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-xl font-bold">Final Confirmation</DialogTitle>
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
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 font-medium">
                  Important: Final Verification Required
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  Please verify your selected numbers carefully. All sales are final and tickets cannot be edited or refunded after purchase.
                </p>
              </div>
            </div>
          </div>
          
          {/* Draw information */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-center">
            <p className="text-sm text-blue-700">
              {seriesName} {drawId ? `- Draw #${drawId}` : ''}
            </p>
          </div>
          
          {/* Display tickets */}
          <div className="bg-gray-100 rounded-lg p-4 mb-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <TicketIcon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Your {tickets.length > 1 ? `Tickets (${tickets.length})` : 'Selected Numbers'}</h3>
            </div>
            
            {hasMultipleTickets ? (
              // Multiple tickets display
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
            ) : (
              // Single ticket display (legacy support)
              <>
                <div className="mb-3">
                  <div className="text-sm text-gray-600 mb-1">Main Numbers (5):</div>
                  <div className="flex gap-2 flex-wrap">
                    {selectedNumbers.sort((a, b) => a - b).map((num) => (
                      <Badge 
                        key={num} 
                        variant="default"
                        className="bg-primary text-white h-10 w-10 rounded-full flex items-center justify-center lotto-number text-lg"
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
                        className="bg-accent text-white h-10 w-10 rounded-full flex items-center justify-center lotto-number text-lg"
                      >
                        {selectedLottoNumber < 10 ? `0${selectedLottoNumber}` : selectedLottoNumber}
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Tickets:</span>
              <span className="crypto-value">{ticketCount}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Price per ticket:</span>
              <span className="crypto-value">
                {ticketPrice < 0.0001 ? ticketPrice.toFixed(6) : ticketPrice.toFixed(4)} ETH
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Total price:</span>
              <span className="crypto-value">
                {totalTicketsPrice < 0.0001 ? totalTicketsPrice.toFixed(6) : totalTicketsPrice.toFixed(4)} ETH
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Network fee (est.):</span>
              <span className="crypto-value">{networkFee.toFixed(4)} ETH</span>
            </div>
            <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-semibold">
              <span>Total:</span>
              <span className="crypto-value">
                {totalCost < 0.0001 ? totalCost.toFixed(6) : totalCost.toFixed(4)} ETH
              </span>
            </div>
            <div className="text-right text-sm text-gray-500 mt-1">
              ≈ {formatUSD(totalCost.toString())}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-2 items-start bg-black/40 p-3 rounded-lg border border-primary/30">
              <Checkbox 
                id="terms" 
                checked={termsAccepted} 
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm text-white font-normal">
                I have verified my numbers and understand that all sales are final. Once confirmed, this ticket cannot be altered or refunded.
              </Label>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button
            variant="outline" 
            onClick={onClose}
            className="w-1/2 border border-gray-300 text-gray-700 font-semibold rounded-full py-3 transition hover:bg-gray-50"
          >
            Go Back
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!termsAccepted}
            className="w-1/2 bg-primary hover:bg-opacity-90 text-white font-semibold rounded-full py-3 transition flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Confirm Purchase</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}