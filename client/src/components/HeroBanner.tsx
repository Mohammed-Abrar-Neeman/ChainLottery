import React, { Dispatch, SetStateAction, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useLotteryContract } from '@/hooks/useLotteryContract';
import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppKitAccount } from '@reown/appkit/react';
import { useMaticPrice } from "@/hooks/useEthPrice";

// Props interface for shared state
interface HeroBannerProps {
  sharedSeriesIndex?: number;
  setSharedSeriesIndex?: Dispatch<SetStateAction<number | undefined>>;
  sharedDrawId?: number;
  setSharedDrawId?: Dispatch<SetStateAction<number | undefined>>;
  seriesList: any[];
  seriesDraws: any[];
  isLoading?: boolean;
  homeDrawId?: number;
  setHomeDrawId?: Dispatch<SetStateAction<number | undefined>>;
  isInitialLoad: boolean;
}

// Utility function to format USD
const formatUSD = (ethAmount: string) => {
  const ethPrice = 2000; // TODO: Get this from an API
  const usdAmount = parseFloat(ethAmount) * ethPrice;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(usdAmount);
};

// Add this helper function at the top level
const formatTimeRemaining = (timeRemaining: { days: number; hours: number; minutes: number; seconds: number }) => {
  return {
    days: Math.max(0, timeRemaining.days),
    hours: Math.max(0, timeRemaining.hours),
    minutes: Math.max(0, timeRemaining.minutes),
    seconds: Math.max(0, timeRemaining.seconds)
  };
};

export default function HeroBanner({
  sharedSeriesIndex,
  setSharedSeriesIndex,
  sharedDrawId,
  setSharedDrawId,
  seriesList,
  seriesDraws,
  isLoading = false,
  homeDrawId,
  setHomeDrawId,
  isInitialLoad
}: HeroBannerProps) {
  console.log('=== HeroBanner Component Render ===');
  console.log('Props:', {
    sharedSeriesIndex,
    sharedDrawId,
    seriesListLength: seriesList?.length,
    seriesDrawsLength: seriesDraws?.length,
    isLoading
  });

  const { getLotteryData, getSeriesList, getSeriesDraws } = useLotteryContract();
  const { address, isConnected } = useAppKitAccount();
  const [showWalletModal, setShowWalletModal] = React.useState(false);

  const maticPrice = useMaticPrice();

  // Utility function to format USD
  const formatUSD = (maticAmount: string) => {
    if (maticPrice === undefined) return <span className="inline-flex items-center"><svg className="animate-spin h-4 w-4 mr-1 text-gray-400" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Loading...</span>;
    if (maticPrice === null) return 'Unavailable';
    const usdAmount = parseFloat(maticAmount) * maticPrice;
    return `$${usdAmount.toFixed(5)}`;
  };

  // Fetch lottery data for the selected series and draw
  const { data: lotteryData } = useQuery({
    queryKey: ['lotteryData', sharedSeriesIndex, sharedDrawId],
    queryFn: () => {
      console.log('=== HeroBanner Fetching Lottery Data ===');
      console.log('Series index:', sharedSeriesIndex);
      console.log('Draw ID:', sharedDrawId);
      return getLotteryData(sharedSeriesIndex, sharedDrawId);
    },
    enabled: sharedSeriesIndex !== undefined && sharedDrawId !== undefined,
    staleTime: 0,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const scrollToBuyTickets = () => {
    const element = document.getElementById('buy-tickets');
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      element.classList.add('highlight-target');
      setTimeout(() => {
        element.classList.remove('highlight-target');
      }, 1500);
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    
    if (!isConnected) {
      setShowWalletModal(true);
    }
  };
  
  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      element.classList.add('highlight-target');
      setTimeout(() => {
        element.classList.remove('highlight-target');
      }, 1500);
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };
  
  // Set initial draw id
  useEffect(() => {
    console.log('=== DRAW SELECTION EFFECT TRIGGERED ===');
    console.log('Current state:', {
      seriesDraws,
      homeDrawId,
      sharedDrawId: sharedDrawId,
      isInitialLoad
    });

    if (!seriesDraws || seriesDraws.length === 0) {
      console.log('No draws available, returning');
      return;
    }

    if (!setHomeDrawId) {
      console.log('setHomeDrawId is not available, returning');
      return;
    }

    // Log all draws with their status
    const drawsWithStatus = seriesDraws.map(draw => ({
      drawId: draw.drawId,
      completed: draw.completed,
      isActive: !draw.completed && draw.drawId !== 0
    }));
    console.log('All draws with status:', drawsWithStatus);

    // Get all active draws
    const activeDraws = seriesDraws.filter(draw => !draw.completed && draw.drawId !== 0);
    console.log('Active draws found:', activeDraws);

    if (activeDraws.length > 0) {
      // Sort active draws by ID to get the latest active draw
      const latestActiveDraw = activeDraws.sort((a, b) => b.drawId - a.drawId)[0];
      console.log('Selected latest active draw:', latestActiveDraw);

      // Update both state variables
      console.log('Updating state with active draw:', latestActiveDraw.drawId);
      if (setSharedDrawId) {
        console.log('Setting shared draw ID to:', latestActiveDraw.drawId);
        setSharedDrawId(latestActiveDraw.drawId);
      }
      console.log('Setting home draw ID to:', latestActiveDraw.drawId);
      setHomeDrawId(latestActiveDraw.drawId);
    } else {
      console.log('No active draws found, looking for completed draws');
      // Get completed draws
      const completedDraws = seriesDraws
        .filter(draw => draw.drawId !== 0 && draw.completed)
        .sort((a, b) => b.drawId - a.drawId);

      console.log('Completed draws found:', completedDraws);

      if (completedDraws.length > 0) {
        const latestCompletedDraw = completedDraws[0];
        console.log('Selected latest completed draw:', latestCompletedDraw);

        console.log('Updating state with completed draw:', latestCompletedDraw.drawId);
        if (setSharedDrawId) {
          console.log('Setting shared draw ID to:', latestCompletedDraw.drawId);
          setSharedDrawId(latestCompletedDraw.drawId);
        }
        console.log('Setting home draw ID to:', latestCompletedDraw.drawId);
        setHomeDrawId(latestCompletedDraw.drawId);
      } else {
        console.log('No draws available, resetting state');
        if (setSharedDrawId) {
          setSharedDrawId(undefined);
        }
        setHomeDrawId(undefined);
      }
    }
  }, [seriesDraws, setHomeDrawId, setSharedDrawId]);

  // Handle series change
  const handleSeriesChange = (value: string) => {
    const newSeriesIndex = parseInt(value);
    console.log('=== SERIES CHANGE HANDLER ===');
    console.log('Current state:', {
      oldSeriesIndex: sharedSeriesIndex,
      newSeriesIndex,
      currentDrawId: homeDrawId
    });
    
    // Update series index
    if (setSharedSeriesIndex) {
      console.log('Updating series index to:', newSeriesIndex);
      setSharedSeriesIndex(newSeriesIndex);
    }

    // Reset draw IDs to trigger the effect
    console.log('Resetting draw IDs');
    if (setSharedDrawId) {
      setSharedDrawId(undefined);
    }
    if (setHomeDrawId) {
      setHomeDrawId(undefined);
    }
  };
  
  const handleDrawChange = (value: string) => {
    const newDrawId = parseInt(value);
    console.log('=== HeroBanner Draw Change ===');
    console.log('Old draw ID:', sharedDrawId);
    console.log('New draw ID:', newDrawId);
    
    if (setSharedDrawId && sharedDrawId !== newDrawId) {
      setSharedDrawId(newDrawId);
    }
  };

  // Get draw date for display
  const getDrawDate = (draws: any[], drawId: number): string => {
    const draw = draws.find(d => d.drawId === drawId);
    if (!draw) return 'Unknown';
    
    const date = new Date(draw.endTimestamp * 1000);
    return date.toLocaleDateString();
  };

  // Get jackpot amount
  const getJackpotAmount = (): string => {
    const amount = lotteryData?.jackpotAmount || '0';
    return parseFloat(amount) > 0 ? parseFloat(amount).toFixed(5) : '0.00000';
  };

  // Get participant count
  const getParticipantCount = (): string => {
    console.log('=== Getting Participant Count ===');
    console.log('Lottery Data:', lotteryData);
    
    // Use totalTickets from lottery data
    const count = lotteryData?.participantCount || 0;
    console.log('Total tickets/participants:', count);
    
    // Ensure we return a string with at least 1 if there are tickets
    return count > 0 ? count.toString() : '0';
  };

  // Calculate time remaining
  const timeRemaining = React.useMemo(() => {
    if (!lotteryData?.timeRemaining) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const totalSeconds = lotteryData.timeRemaining;
    return {
      days: Math.floor(totalSeconds / (24 * 60 * 60)),
      hours: Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60)),
      minutes: Math.floor((totalSeconds % (60 * 60)) / 60),
      seconds: Math.floor(totalSeconds % 60)
    };
  }, [lotteryData?.timeRemaining]);

  // Check if there's an active draw
  const isDrawAvailable = React.useMemo(() => {
    if (!seriesDraws || !sharedDrawId) return false;
    const draw = seriesDraws.find(d => d.drawId === sharedDrawId);
    return draw && !draw.completed;
  }, [seriesDraws, sharedDrawId]);

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
            
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6 mb-8 border border-primary/20">
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
                {isLoading ? 'Loading...' : 'Choose Your Lottery'}
              </div>
            </div>
            
            <div className="bg-gray-750 bg-opacity-90 pt-16 pb-8 px-8 lg:px-12 h-full flex flex-col border-l border-primary/20">
              {/* Series and Draw Selection */}
              <div className="mb-6 flex space-x-4">
                <div className="w-1/2">
                  <label className="text-sm font-mono uppercase tracking-wider text-primary mb-1 block">
                    Series
                  </label>
                  <Select
                    value={sharedSeriesIndex?.toString() || "0"}
                    onValueChange={handleSeriesChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="bg-black/30 border border-primary/30 text-white">
                      <SelectValue placeholder={isLoading ? "Loading..." : "Select series"} />
                    </SelectTrigger>
                    <SelectContent className="border border-primary/30">
                      {isLoading ? (
                        <SelectItem key="loading" value="0" disabled>
                          Loading...
                        </SelectItem>
                      ) : seriesList && seriesList.length > 0 ? (
                        seriesList.map((series) => (
                          <SelectItem key={series.index} value={series.index.toString()}>
                            {series.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem key="no-data" value="0" disabled>
                          No Series Available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-1/2">
                  <label className="text-sm font-mono uppercase tracking-wider text-primary mb-1 block">
                    Draw
                  </label>
                  <Select
                    value={sharedDrawId?.toString() || "1"}
                    onValueChange={handleDrawChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="bg-black/30 border border-primary/30 text-white">
                      <SelectValue placeholder={isLoading ? "Loading..." : "Select draw"} />
                    </SelectTrigger>
                    <SelectContent className="border border-primary/30">
                      {isLoading ? (
                        <SelectItem key="loading" value="1" disabled>
                          Loading...
                        </SelectItem>
                      ) : seriesDraws && seriesDraws.length > 0 ? (
                        seriesDraws.filter(draw => draw.drawId !== 0).map((draw) => (
                          <SelectItem key={draw.drawId} value={draw.drawId.toString()}>
                            Draw #{draw.drawId} {draw.completed ? '(Completed)' : '(Active)'}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem key="no-draws" value="1" disabled>
                          No Draws Available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex-1">
                {!isDrawAvailable && (
                  <div className="bg-black/30 border border-primary/20 rounded-lg p-4 mb-6">
                    <p className="text-lg font-semibold mb-1 text-white">No Active Draws Available</p>
                    <p className="text-sm opacity-75">
                      The admin must start a new lottery draw. Check back soon!
                    </p>
                  </div>
                )}
                
                <div className="mb-8 relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-primary/10 to-primary/10 rounded-xl blur"></div>
                  <div className="relative bg-black/30 backdrop-blur-sm rounded-lg border border-primary/30 p-6">
                    <span className="text-xs font-mono uppercase tracking-wider text-primary/80">Current Jackpot</span>
                    <div className="flex items-baseline">
                      <span className="text-4xl lg:text-6xl crypto-value animate-glow">
                        {getJackpotAmount()}
                      </span>
                      <span className="ml-2 text-xl bg-gradient-to-r from-primary to-yellow-400 text-transparent bg-clip-text font-bold">ETH</span>
                    </div>
                    <span className="text-sm font-mono text-white/60">
                      ≈ {formatUSD(getJackpotAmount())}
                    </span>
                  </div>
                </div>
                
                <div className="mb-8">
                  <span className="text-xs font-mono uppercase tracking-wider text-primary/80 block mb-2">Time Remaining</span>
                  {isDrawAvailable ? (
                    <div className="grid grid-cols-4 gap-2 font-mono">
                      <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-3 text-center">
                        <div className="text-2xl text-white lotto-number">
                          {Math.max(0, timeRemaining.days).toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs uppercase text-primary/70">Days</div>
                      </div>
                      <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-3 text-center">
                        <div className="text-2xl text-white lotto-number">
                          {Math.max(0, timeRemaining.hours).toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs uppercase text-primary/70">Hours</div>
                      </div>
                      <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-3 text-center">
                        <div className="text-2xl text-white lotto-number">
                          {Math.max(0, timeRemaining.minutes).toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs uppercase text-primary/70">Mins</div>
                      </div>
                      <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-3 text-center">
                        <div className="text-2xl text-white lotto-number">
                          {Math.max(0, timeRemaining.seconds).toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs uppercase text-primary/70">Secs</div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 font-mono">
                      <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-3 text-center">
                        <div className="text-2xl text-white lotto-number">00</div>
                        <div className="text-xs uppercase text-primary/70">Days</div>
                      </div>
                      <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-3 text-center">
                        <div className="text-2xl text-white lotto-number">00</div>
                        <div className="text-xs uppercase text-primary/70">Hours</div>
                      </div>
                      <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-3 text-center">
                        <div className="text-2xl text-white lotto-number">00</div>
                        <div className="text-xs uppercase text-primary/70">Mins</div>
                      </div>
                      <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-3 text-center">
                        <div className="text-2xl text-white lotto-number">00</div>
                        <div className="text-xs uppercase text-primary/70">Secs</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-4">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-primary/80">Participants</span>
                    <div className="text-2xl mt-1 text-white lotto-number">
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
      
    </section>
  );
}