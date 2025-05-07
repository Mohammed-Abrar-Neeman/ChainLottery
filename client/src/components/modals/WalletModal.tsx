import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWallet } from '@/hooks/useWallet';
import { X } from 'lucide-react';
import metamaskLogo from '@/assets/metamask-fox.svg';

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WalletModal({ open, onClose }: WalletModalProps) {
  const { connect, isConnecting } = useWallet();

  const handleConnectMetaMask = async () => {
    const success = await connect('metamask');
    if (success) {
      onClose();
    }
  };

  const handleConnectWalletConnect = async () => {
    // In a full implementation, this would connect via WalletConnect
    // Currently only MetaMask is supported
  };

  const handleConnectCoinbaseWallet = async () => {
    // In a full implementation, this would connect via Coinbase Wallet
    // Currently only MetaMask is supported
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="glass rounded-2xl shadow-glass max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-xl font-bold">Connect Wallet</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <Button 
            onClick={handleConnectMetaMask}
            disabled={isConnecting}
            variant="outline"
            className="w-full flex items-center justify-between bg-white hover:bg-gray-50 transition border border-gray-200 rounded-xl p-4 h-auto"
          >
            <div className="flex items-center">
              <img 
                src={metamaskLogo}
                alt="MetaMask Logo" 
                className="h-10 w-10 mr-4 bg-white rounded-full border border-gray-200 object-contain"
              />
              <div className="text-center">
                <h4 className="font-semibold" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>MetaMask</h4>
                <p className="text-sm text-gray-500">Connect using browser wallet</p>
              </div>
            </div>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-gray-400" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          </Button>
          
          <Button 
            onClick={handleConnectWalletConnect}
            disabled={isConnecting}
            variant="outline"
            className="w-full flex items-center justify-between bg-white hover:bg-gray-50 transition border border-gray-200 rounded-xl p-4 h-auto"
          >
            <div className="flex items-center">
              <img 
                src="https://cdn.jsdelivr.net/npm/@walletconnect/web3-provider@1.7.8/assets/walletconnect-logo.svg" 
                alt="WalletConnect Logo" 
                className="h-10 w-10 mr-4 bg-white rounded-full border border-gray-200 object-contain"
                onError={(e) => { e.currentTarget.src = 'https://seeklogo.com/images/W/walletconnect-logo-EE83B50C97-seeklogo.com.png'; }}
              />
              <div className="text-center">
                <h4 className="font-semibold" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>WalletConnect</h4>
                <p className="text-sm text-gray-500">Connect using mobile wallet</p>
              </div>
            </div>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-gray-400" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          </Button>
          
          <Button 
            onClick={handleConnectCoinbaseWallet}
            disabled={isConnecting}
            variant="outline"
            className="w-full flex items-center justify-between bg-white hover:bg-gray-50 transition border border-gray-200 rounded-xl p-4 h-auto"
          >
            <div className="flex items-center">
              <img 
                src="https://avatars.githubusercontent.com/u/1885080?s=200&v=4" 
                alt="Coinbase Wallet Logo" 
                className="h-10 w-10 mr-4 bg-white rounded-full border border-gray-200 object-contain"
                onError={(e) => { e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Coinbase_logo.svg'; }}
              />
              <div className="text-center">
                <h4 className="font-semibold" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>Coinbase Wallet</h4>
                <p className="text-sm text-gray-500">Connect using Coinbase Wallet</p>
              </div>
            </div>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-gray-400" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          </Button>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>
            By connecting your wallet, you agree to our 
            <a href="#" className="text-primary hover:text-accent ml-1">Terms of Service</a> and 
            <a href="#" className="text-primary hover:text-accent ml-1">Privacy Policy</a>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
