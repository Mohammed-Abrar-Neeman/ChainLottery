import React from 'react';
import { Button } from '@/components/ui/button';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useWallet } from '@/hooks/useWallet';
import WalletModal from './modals/WalletModal';
import { InfoIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function HeroBanner() {
  const { lotteryData, timeRemaining, formatUSD } = useLotteryData();
  const { isConnected } = useWallet();
  const [showWalletModal, setShowWalletModal] = React.useState(false);
  
  const scrollToBuyTickets = () => {
    const element = document.getElementById('buy-tickets');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    
    if (!isConnected) {
      setShowWalletModal(true);
    }
  };
  
  return (
    <section className="mb-16">
      <div className="glass rounded-3xl shadow-glass overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text">
                Blockchain Lottery
              </span>
            </h2>
            <p className="text-lg mb-8 text-gray-700">
              Join the fairest, most transparent lottery system powered by blockchain technology.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={scrollToBuyTickets}
                className="bg-primary hover:bg-opacity-90 text-white font-semibold rounded-full px-8 py-3 transition"
              >
                Buy Tickets
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold rounded-full px-8 py-3 transition"
                  >
                    How It Works
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <InfoIcon className="h-5 w-5 text-primary" />
                      How CryptoLotto Works
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary bg-opacity-20 flex items-center justify-center font-semibold">1</div>
                      <div>
                        <p>Buy as many tickets as you want (1-100 per transaction)</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary bg-opacity-20 flex items-center justify-center font-semibold">2</div>
                      <div>
                        <p>Wait for the lottery round to end (~24 hours)</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary bg-opacity-20 flex items-center justify-center font-semibold">3</div>
                      <div>
                        <p>If you win, the prize is automatically sent to your wallet</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary bg-opacity-20 flex items-center justify-center font-semibold">4</div>
                      <div>
                        <p>Winner selection is verifiably random using ChainLink VRF</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold uppercase mb-2">Prize Distribution</h4>
                      <div className="flex items-center mb-2">
                        <div className="w-full bg-gray-200 rounded-full h-4 mr-2">
                          <div className="bg-accent h-4 rounded-full" style={{ width: '70%' }}></div>
                        </div>
                        <span className="text-sm font-mono">70%</span>
                      </div>
                      <p className="text-sm text-gray-600">70% to Winner, 20% to Next Lottery, 10% to Treasury</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="lg:w-1/2 relative">
            <div className="bg-gradient-to-br from-primary to-accent p-8 lg:p-12 h-full flex flex-col justify-center text-white">
              <div className="mb-6">
                <span className="text-sm font-mono uppercase tracking-wider opacity-75">Current Jackpot</span>
                <div className="flex items-baseline">
                  <span className="text-4xl lg:text-5xl font-bold font-mono">{lotteryData?.jackpotAmount || '3.457'}</span>
                  <span className="ml-2 text-xl">ETH</span>
                </div>
                <span className="text-sm font-mono opacity-75">
                  ≈ {formatUSD(lotteryData?.jackpotAmount || '3.457')}
                </span>
              </div>
              
              <div className="mb-6">
                <span className="text-sm font-mono uppercase tracking-wider opacity-75">Time Remaining</span>
                <div className="flex space-x-2 mt-1 font-mono">
                  <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center w-16">
                    <div className="text-2xl font-bold">{timeRemaining.hours.toString().padStart(2, '0')}</div>
                    <div className="text-xs uppercase">Hours</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center w-16">
                    <div className="text-2xl font-bold">{timeRemaining.minutes.toString().padStart(2, '0')}</div>
                    <div className="text-xs uppercase">Mins</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center w-16">
                    <div className="text-2xl font-bold">{timeRemaining.seconds.toString().padStart(2, '0')}</div>
                    <div className="text-xs uppercase">Secs</div>
                  </div>
                </div>
              </div>
              
              <div>
                <span className="text-sm font-mono uppercase tracking-wider opacity-75">Participants</span>
                <div className="text-2xl font-bold mt-1">{lotteryData?.participantCount || 157}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <WalletModal open={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </section>
  );
}
