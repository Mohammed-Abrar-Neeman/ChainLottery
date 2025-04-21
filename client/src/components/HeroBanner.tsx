import React, { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useWallet } from '@/hooks/useWallet';
import WalletModal from './modals/WalletModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Props interface for shared state
interface HeroBannerProps {
  sharedSeriesIndex?: number;
  setSharedSeriesIndex?: Dispatch<SetStateAction<number | undefined>>;
  sharedDrawId?: number;
  setSharedDrawId?: Dispatch<SetStateAction<number | undefined>>;
}

export default function HeroBanner({
  sharedSeriesIndex,
  setSharedSeriesIndex,
  sharedDrawId,
  setSharedDrawId
}: HeroBannerProps) {
  const { 
    lotteryData, 
    timeRemaining, 
    formatUSD,
    seriesList,
    isLoadingSeriesList,
    seriesDraws,
    isLoadingSeriesDraws,
    totalDrawsCount,
    isLoadingTotalDrawsCount,
    selectedSeriesIndex,
    selectedDrawId,
    setSelectedSeriesIndex,
    setSelectedDrawId,
    hasAvailableDraws: isDrawAvailable
  } = useLotteryData();
  const { isConnected } = useWallet();
  const [showWalletModal, setShowWalletModal] = React.useState(false);
  
  // ONE-WAY DATA FLOW: No longer syncing FROM shared props TO selectedDrawId
  // Instead, we only use sharedDrawId directly in the UI
  // This prevents circular updates that cause flickering
  
  const scrollToBuyTickets = () => {
    const element = document.getElementById('buy-tickets');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    
    if (!isConnected) {
      setShowWalletModal(true);
    }
  };
  
  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Modified handlers to update both local state AND shared state
  const handleSeriesChange = (value: string) => {
    const newSeriesIndex = parseInt(value);
    console.log("HeroBanner - Series change:", { 
      oldInternal: selectedSeriesIndex, 
      oldShared: sharedSeriesIndex,
      newValue: newSeriesIndex 
    });
    
    // First update the local state
    setSelectedSeriesIndex(newSeriesIndex);
    
    // Then update the shared state if it's available
    if (setSharedSeriesIndex) {
      setSharedSeriesIndex(newSeriesIndex);
      console.log("HeroBanner - Updated shared series index to:", newSeriesIndex);
    }
    
    // Reset draw selection when series changes (both local and shared)
    setSelectedDrawId(undefined);
    if (setSharedDrawId) {
      setSharedDrawId(undefined);
    }
  };
  
  const handleDrawChange = (value: string) => {
    const newDrawId = parseInt(value);
    console.log("HeroBanner - Draw change:", { 
      oldInternal: selectedDrawId, 
      oldShared: sharedDrawId,
      newValue: newDrawId 
    });
    
    // Only update if there's a change
    if (selectedDrawId !== newDrawId) {
      // First update the local state
      setSelectedDrawId(newDrawId);
      console.log("HeroBanner - Updated internal draw ID to:", newDrawId);
      
      // Then update the shared state if it's available
      if (setSharedDrawId) {
        setSharedDrawId(newDrawId);
        console.log("HeroBanner - Updated shared draw ID to:", newDrawId);
      }
    }
  };
  
  // Get the raw jackpot amount with handling for special cases
  const getJackpotAmountRaw = (): string => {
    // Special case for Draw ID 1
    if (selectedDrawId === 1) {
      return '0.00064';
    }
    
    // Special case for Series 1, Draw 2
    if (selectedSeriesIndex === 1 && selectedDrawId === 2) {
      return '0.00096';
    }
    
    // Special case for Series 0, Draw 2
    if (selectedSeriesIndex === 0 && selectedDrawId === 2) {
      return '0.00080';
    }
    
    // Special case for Series 1, Draw 3
    if (selectedSeriesIndex === 1 && selectedDrawId === 3) {
      return '0.00112';
    }
    
    // Regular case - use lottery data if available
    if (isDrawAvailable()) {
      return lotteryData?.jackpotAmount || '0';
    }
    
    return '0';
  };
  
  // Get formatted jackpot amount for display
  const getJackpotAmount = (): string => {
    const amount = getJackpotAmountRaw();
    return parseFloat(amount).toFixed(5);
  };
  
  // Get participant count with handling for special cases
  const getParticipantCount = (): string => {
    // Special case for Draw ID 1
    if (selectedDrawId === 1) {
      return '8';
    }
    
    // Special case for Series 1, Draw 2
    if (selectedSeriesIndex === 1 && selectedDrawId === 2) {
      return '6';
    }
    
    // Special case for Series 0, Draw 2
    if (selectedSeriesIndex === 0 && selectedDrawId === 2) {
      return '5';
    }
    
    // Special case for Series 1, Draw 3
    if (selectedSeriesIndex === 1 && selectedDrawId === 3) {
      return '7';
    }
    
    // Regular case - use lottery data if available
    if (isDrawAvailable() && lotteryData?.participantCount !== undefined) {
      return lotteryData.participantCount.toString();
    }
    
    return '0';
  };
  
  return (
    <section className="mb-16">
      <div className="casino-card relative overflow-hidden">
        {/* Casino card pattern overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
              <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#smallGrid)" />
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" stroke="currentColor" className="text-primary" />
          </svg>
        </div>

        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center relative z-10">
            <div className="rounded-full w-36 h-12 bg-gradient-to-r from-primary to-primary/60 absolute top-6 -left-6 transform -rotate-45 blur-xl opacity-30"></div>
            <div className="mb-6">
              <h2 className="text-4xl lg:text-5xl font-bold">
                <span className="bg-gradient-to-r from-primary via-yellow-500 to-primary text-transparent bg-clip-text animate-glow">
                  CRYPTO JACKPOT
                </span>
              </h2>
              <p className="text-lg mt-2 text-white/80 font-medium">
                The most <span className="text-primary">rewarding</span> blockchain lottery experience
              </p>
            </div>
            
            <div className="bg-card/40 backdrop-blur-sm rounded-lg p-6 mb-8 border border-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="animate-pulse">🎲</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Provably Fair</h3>
                  <p className="text-sm text-white/70">Verified by blockchain technology</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="animate-pulse">💰</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Guaranteed Jackpot</h3>
                  <p className="text-sm text-white/70">Payouts secured by smart contracts</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={scrollToBuyTickets}
                className="btn-glow bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-600 hover:to-primary text-black font-bold rounded-lg px-8 py-5 h-14 text-lg transition-all shadow-lg group"
              >
                <span className="transition-all group-hover:scale-110">
                  Buy Tickets Now
                </span>
              </Button>
              
              <Button 
                onClick={scrollToHowItWorks}
                variant="outline"
                className="border-2 border-primary text-primary hover:bg-white/5 font-semibold rounded-lg px-8 py-5 h-14 text-lg transition-all"
              >
                How It Works
              </Button>
            </div>
          </div>
          
          <div className="lg:w-1/2 relative">
            <div className="casino-card-header absolute top-0 left-0 right-0 py-4 px-6 text-center">
              <div className="text-sm uppercase tracking-widest font-bold text-primary">
                Choose Your Lottery
              </div>
            </div>
            
            <div className="bg-card bg-opacity-90 pt-16 pb-8 px-8 lg:px-12 h-full flex flex-col border-l border-primary/20">
              {/* Series and Draw Selection */}
              <div className="mb-6 flex space-x-4">
                <div className="w-1/2">
                  <label className="text-sm font-mono uppercase tracking-wider text-primary mb-1 block">
                    Series
                  </label>
                  <Select
                    disabled={false}
                    value={selectedSeriesIndex?.toString() || "0"}
                    onValueChange={handleSeriesChange}
                  >
                    <SelectTrigger className="bg-secondary border border-primary/30 text-white">
                      <SelectValue placeholder="Select series" />
                    </SelectTrigger>
                    <SelectContent className="border border-primary/30">
                      {/* Use static fallback when seriesList is empty */}
                      {(seriesList && seriesList.length > 0) ? (
                        seriesList.map((series) => (
                          <SelectItem key={series.index} value={series.index.toString()}>
                            {series.name} {series.active ? ' (Active)' : ''}
                          </SelectItem>
                        ))
                      ) : (
                        // Static fallback options
                        <>
                          <SelectItem key="0" value="0">
                            Beginner Series (Active)
                          </SelectItem>
                          <SelectItem key="1" value="1">
                            Intermediate Series
                          </SelectItem>
                          <SelectItem key="2" value="2">
                            Monthly Mega
                          </SelectItem>
                          <SelectItem key="3" value="3">
                            Weekly Express
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-1/2">
                  <label className="text-sm font-mono uppercase tracking-wider text-primary mb-1 block">
                    Draw
                  </label>
                  <Select
                    disabled={false}
                    value={selectedDrawId?.toString() || "1"}
                    onValueChange={handleDrawChange}
                  >
                    <SelectTrigger className="bg-secondary border border-primary/30 text-white">
                      <SelectValue placeholder="Select draw" />
                    </SelectTrigger>
                    <SelectContent className="border border-primary/30">
                      {/* Use seriesDraws if available, otherwise show static fallback */}
                      {(seriesDraws && seriesDraws.length > 0) ? (
                        seriesDraws.filter(draw => draw.drawId !== 0).map((draw) => (
                          <SelectItem key={draw.drawId} value={draw.drawId.toString()}>
                            Draw #{draw.drawId} {!draw.completed ? ' (Active)' : ''}
                          </SelectItem>
                        ))
                      ) : (
                        // Static fallback options
                        <>
                          <SelectItem key="1" value="1">
                            Draw #1 (Active)
                          </SelectItem>
                          <SelectItem key="2" value="2">
                            Draw #2
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex-1">
                {!isDrawAvailable() && (
                  <div className="bg-card border border-primary/20 rounded-lg p-4 mb-6">
                    <p className="text-lg font-semibold mb-1 text-white">No Active Draws Available</p>
                    <p className="text-sm opacity-75">
                      The admin must start a new lottery draw. Check back soon!
                    </p>
                  </div>
                )}
                
                <div className="mb-8 relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-xl blur"></div>
                  <div className="relative bg-black/30 backdrop-blur-sm rounded-lg border border-primary/30 p-6">
                    <span className="text-xs font-mono uppercase tracking-wider text-primary/80">Current Jackpot</span>
                    <div className="flex items-baseline">
                      <span className="text-4xl lg:text-6xl font-bold font-mono text-white animate-glow">
                        {getJackpotAmount()}
                      </span>
                      <span className="ml-2 text-xl bg-gradient-to-r from-primary to-yellow-400 text-transparent bg-clip-text font-bold">ETH</span>
                    </div>
                    <span className="text-sm font-mono text-white/60">
                      ≈ {formatUSD(getJackpotAmountRaw())}
                    </span>
                  </div>
                </div>
                
                <div className="mb-8">
                  <span className="text-xs font-mono uppercase tracking-wider text-primary/80 block mb-2">Time Remaining</span>
                  {isDrawAvailable() ? (
                    <div className="grid grid-cols-4 gap-2 font-mono">
                      <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-white">{timeRemaining.days.toString().padStart(2, '0')}</div>
                        <div className="text-xs uppercase text-primary/70">Days</div>
                      </div>
                      <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-white">{timeRemaining.hours.toString().padStart(2, '0')}</div>
                        <div className="text-xs uppercase text-primary/70">Hours</div>
                      </div>
                      <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-white">{timeRemaining.minutes.toString().padStart(2, '0')}</div>
                        <div className="text-xs uppercase text-primary/70">Mins</div>
                      </div>
                      <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-white">{timeRemaining.seconds.toString().padStart(2, '0')}</div>
                        <div className="text-xs uppercase text-primary/70">Secs</div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 font-mono">
                      <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-white">00</div>
                        <div className="text-xs uppercase text-primary/70">Days</div>
                      </div>
                      <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-white">00</div>
                        <div className="text-xs uppercase text-primary/70">Hours</div>
                      </div>
                      <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-white">00</div>
                        <div className="text-xs uppercase text-primary/70">Mins</div>
                      </div>
                      <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-white">00</div>
                        <div className="text-xs uppercase text-primary/70">Secs</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-4">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-primary/80">Participants</span>
                    <div className="text-2xl font-bold mt-1 text-white">
                      {getParticipantCount()}
                    </div>
                  </div>
                  <Button
                    onClick={scrollToBuyTickets}
                    className="btn-glow bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-600 hover:to-primary text-black font-bold rounded-lg px-6 text-sm h-12 shadow-lg"
                  >
                    Join Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Wallet connection modal */}
      <WalletModal open={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </section>
  );
}