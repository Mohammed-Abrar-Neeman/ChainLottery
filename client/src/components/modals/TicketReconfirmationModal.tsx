import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, TicketIcon, AlertTriangle, CheckCircle, ExternalLink, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatEther } from 'viem';
import { useLotteryContract } from '@/hooks/useLotteryContract';

interface Ticket {
  id: string;
  numbers: number[];
  lottoNumber: number | null;
}

interface TicketReconfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tickets: Array<{id: string, numbers: number[], lottoNumber: number | null}>;
  ticketPrice: number;
  totalTicketsPrice: number;
  totalCost: number;
  selectedNumbers: number[];
  selectedLottoNumber: number | null;
  seriesIndex?: number;
  drawId?: number;
}

export default function TicketReconfirmationModal({
  open,
  onClose,
  onConfirm,
  tickets = [],
  ticketPrice,
  totalTicketsPrice,
  totalCost,
  selectedNumbers = [],
  selectedLottoNumber = null,
  seriesIndex,
  drawId
}: TicketReconfirmationModalProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [seriesName, setSeriesName] = useState<string>('');
  const [drawInfo, setDrawInfo] = useState<{
    startTime: Date | null;
    endTime: Date | null;
    jackpot: string;
  }>({
    startTime: null,
    endTime: null,
    jackpot: '0'
  });
  
  const hasMultipleTickets = tickets.length > 1;
  const ticketCount = hasMultipleTickets ? tickets.length : 1;
  const { getContract } = useLotteryContract();

  // Fetch series name and draw info when modal opens
  useEffect(() => {
    const fetchData = async () => {
      if (seriesIndex !== undefined && drawId !== undefined) {
        try {
          const contract = await getContract();
          if (contract) {
            // Get series name
            const name = await contract.getSeriesNameByIndex(seriesIndex);
            setSeriesName(name);

            // Get draw info
            const [startTime, endTime, jackpot] = await Promise.all([
              contract.getDrawStartTime(drawId),
              contract.getEstimatedEndTime(drawId),
              contract.getJackpot(drawId)
            ]);

            setDrawInfo({
              startTime: new Date(Number(startTime) * 1000),
              endTime: new Date(Number(endTime) * 1000),
              jackpot: formatEther(jackpot)
            });
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          setSeriesName(`Series #${seriesIndex}`);
        }
      }
    };

    if (open && seriesIndex !== undefined && drawId !== undefined) {
      fetchData();
    }
  }, [open, seriesIndex, drawId, getContract]);

  // Format ETH values
  const formatETH = (value: number) => {
    return value < 0.0001 ? value.toFixed(6) : value.toFixed(4);
  };

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="glass rounded-2xl shadow-glass max-w-md w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-xl font-bold">Final Confirmation</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="text-white/70 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Warning Alert */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-500">
                  Important: Final Verification Required
                </p>
                <p className="text-sm text-white/70 mt-1">
                  Please verify your selected numbers carefully. All sales are final and tickets cannot be edited or refunded after purchase.
                </p>
              </div>
            </div>
          </div>
          
          {/* Draw Information */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="text-center mb-3">
              <p className="text-sm font-medium text-primary">
                {seriesName} {drawId ? `- Draw #${drawId}` : ''}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-white/70">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Start: {formatDate(drawInfo.startTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Clock className="h-4 w-4 text-primary" />
                <span>End: {formatDate(drawInfo.endTime)}</span>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Current Jackpot:</span>
                <span className="text-primary font-medium">
                  {drawInfo.jackpot} ETH
                </span>
              </div>
            </div>
          </div>
          
          {/* Ticket Summary */}
          <div className="bg-black/20 rounded-lg p-4 border border-primary/20">
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
          
          {/* Terms Acceptance */}
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
        
        <div className="flex gap-4 mt-6">
          <Button
            variant="outline" 
            onClick={onClose}
            className="w-1/2 border-primary/20 text-white hover:bg-primary/10 font-semibold rounded-lg py-2 transition"
          >
            Go Back
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!termsAccepted}
            className="w-1/2 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg py-2 transition flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Confirm Purchase</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}