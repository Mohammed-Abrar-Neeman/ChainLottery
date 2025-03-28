import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from 'lucide-react';

interface TransactionPendingModalProps {
  open: boolean;
  onClose: () => void;
  transactionHash: string;
}

export default function TransactionPendingModal({
  open,
  onClose,
  transactionHash
}: TransactionPendingModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="glass rounded-2xl shadow-glass max-w-md w-full text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <h3 className="text-xl font-bold">Transaction Pending</h3>
          <p className="text-gray-600 mt-2">Your transaction is being processed on the blockchain.</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
          <div className="flex justify-between mb-2">
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
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className="text-yellow-500 font-semibold">Pending</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 mb-6">
          <p>
            This window will update automatically once your transaction is confirmed. 
            This may take a few minutes depending on network congestion.
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={onClose}
          className="w-full border border-gray-300 text-gray-700 font-semibold rounded-full py-3 transition hover:bg-gray-50"
        >
          Close and wait
        </Button>
      </DialogContent>
    </Dialog>
  );
}
