import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TransactionPendingModalProps {
  open: boolean;
  onClose: () => void;
  transactionHash?: string;
  isBuying: boolean;
  error: string | null;
}

export default function TransactionPendingModal({
  open,
  onClose,
  transactionHash,
  isBuying,
  error
}: TransactionPendingModalProps) {
  const getExplorerUrl = (hash: string) => {
    return `https://testnet.bscscan.com/tx/${hash}`;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="glass rounded-2xl shadow-glass max-w-md w-full">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-xl font-bold">
            {error ? 'Transaction Failed' : 'Transaction in Progress'}
          </DialogTitle>
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
          {error ? (
            // Error State
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-500">
                    Transaction Failed
                  </p>
                  <p className="text-sm text-white/70 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Loading State
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-medium text-white">
                  {transactionHash ? 'Confirming Transaction' : 'Waiting for Approval'}
                </p>
                <p className="text-sm text-white/70">
                  {transactionHash 
                    ? 'Your transaction is being processed on the blockchain'
                    : 'Please approve the transaction in MetaMask'}
                </p>
              </div>
              
              {transactionHash && (
                <div className="bg-black/20 rounded-lg p-4 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Transaction Hash:</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {`${transactionHash.slice(0, 6)}...${transactionHash.slice(-4)}`}
                    </Badge>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 text-primary hover:text-primary/90"
                    onClick={() => window.open(getExplorerUrl(transactionHash), '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Explorer
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-primary/20 text-white hover:bg-primary/10"
            >
              {error ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
