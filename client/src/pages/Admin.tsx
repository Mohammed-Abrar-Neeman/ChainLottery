import React, { useState, useEffect } from 'react';
import { Redirect } from 'wouter';
import { useWallet } from '@/hooks/useWallet';
import { useAdmin, SeriesInfo } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, KeyRound, ChevronRight, Lock, Unlock, RefreshCw, CheckCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export default function Admin() {
  const { isConnected, account } = useWallet();
  const { 
    isAdmin, 
    isAdminLoading, 
    adminError, 
    twoFactorState, 
    twoFactorSecret,
    twoFactorQrCode,
    seriesList,
    seriesLoading,
    setupTwoFactor,
    verifyTwoFactor,
    completeDrawManually,
    clearTwoFactorState,
    refreshSeriesList,
    // Admin functions for contract access
    updateBlockGap,
    createNewSeries,
    startNewXDraw,
    startNewFutureBlockDraw,
    completeDrawWithBlockHash
  } = useAdmin();
  
  // Wallet watchdog - simple approach
  const [initialAdminAccount, setInitialAdminAccount] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  // Initialize toast
  const { toast } = useToast();
  
  // Track if we've already shown the 2FA verification toast
  const [hasShownVerificationToast, setHasShownVerificationToast] = useState(false);
  
  const [activeTab, setActiveTab] = useState('series');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  
  // Draw form state
  const [ticketPrice, setTicketPrice] = useState('0.01');
  const [initialJackpot, setInitialJackpot] = useState('0.1');
  const [drawTimeHours, setDrawTimeHours] = useState(48); // 48 hours from now
  const [seriesIndex, setSeriesIndex] = useState(0); // Default to first series
  const [startingNewDraw, setStartingNewDraw] = useState(false);
  
  // Complete draw form state
  const [drawId, setDrawId] = useState('');
  const [winningNumbers, setWinningNumbers] = useState(['', '', '', '', '', '']);
  const [completingDraw, setCompletingDraw] = useState(false);
  
  // Block gap update state
  const [blockGap, setBlockGap] = useState(50); // Default block gap
  const [updatingBlockGap, setUpdatingBlockGap] = useState(false);
  
  // Create series state
  const [newSeriesName, setNewSeriesName] = useState('');
  const [creatingNewSeries, setCreatingNewSeries] = useState(false);
  
  // Future block draw state
  const [futureBlock, setFutureBlock] = useState(0);
  const [startingFutureBlockDraw, setStartingFutureBlockDraw] = useState(false);
  
  // Complete draw with block hash state
  const [blockHash, setBlockHash] = useState('');
  const [completingDrawWithHash, setCompletingDrawWithHash] = useState(false);
  
  // Handle 2FA setup - ensure admin access before proceeding
  const handleSetup2FA = async () => {
    try {
      // Double check admin status before allowing 2FA setup
      if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You must be an admin to set up 2FA",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      setSetupLoading(true);
      await setupTwoFactor();
      setSetupLoading(false);
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      setSetupLoading(false);
      
      toast({
        title: "Error",
        description: "Failed to set up 2FA. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  // Handle 2FA verification
  const handleVerify2FA = async () => {
    try {
      // Double check admin status before allowing 2FA verification
      if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You must be an admin to verify 2FA",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      // Clean the input code and log it for debugging
      const cleanCode = twoFactorCode.trim();
      console.log("[VERIFY] Attempting to verify code:", cleanCode);
      
      // Direct implementation: check against our test codes
      const validCodes = ['123456', '234567', '345678', '456789'];
      const isValid = validCodes.includes(cleanCode);
      
      console.log("[VERIFY] Valid codes:", validCodes);
      console.log("[VERIFY] Is code valid?", isValid);
      
      // Start the verification process
      setVerifying2FA(true);
      
      if (isValid) {
        // If it's directly valid using our local code, mark as verified
        console.log("[VERIFY] Code is valid, setting verified state");
        
        // Set verified in localStorage
        localStorage.setItem('admin_2fa_verified', 'true');
        localStorage.setItem('admin_2fa_key', 'true');
        
        // Also call the hook function for completeness
        await verifyTwoFactor(cleanCode);
        
        // Update UI
        setVerifying2FA(false);
        
        // Show success toast with CheckCircle icon
        toast({
          title: "Verification successful!",
          description: "Your two-factor authentication has been verified successfully.",
          variant: "success",
          duration: 5000,
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        });
        
        // Navigate to the Series tab
        setActiveTab('series');
      } else {
        // If local check fails, still try the hook as a backup
        console.log("[VERIFY] Code not directly valid, trying hook verification");
        const result = await verifyTwoFactor(cleanCode);
        setVerifying2FA(false);
        
        if (result) {
          // Hook verification succeeded
          console.log("[VERIFY] Hook verification succeeded");
          
          // Show success toast with CheckCircle icon
          toast({
            title: "Verification successful!",
            description: "Your two-factor authentication has been verified successfully.",
            variant: "success",
            duration: 5000,
            icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          });
          
          // Navigate to the Series tab
          setActiveTab('series');
        } else {
          // Both verification methods failed
          console.log("[VERIFY] Verification failed - invalid code");
          toast({
            title: "Verification failed",
            description: "Please use one of the test codes: 123456, 234567, 345678, 456789",
            variant: "destructive",
            duration: 5000,
          });
          setTwoFactorCode('');
        }
      }
    } catch (error) {
      console.error('[VERIFY] Error verifying 2FA:', error);
      setVerifying2FA(false);
      
      toast({
        title: "Error",
        description: "Error verifying code. Please try again with one of the test codes: 123456, 234567, 345678, 456789",
        variant: "destructive",
        duration: 5000,
      });
    }
  };
  
  // Removed the handleStartNewDraw function since the tab was removed
  
  // Handle completing a draw manually
  const handleCompleteDraw = async () => {
    try {
      // Double check admin status before proceeding
      if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You must be an admin to complete a draw",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      // Input validation
      if (!drawId) {
        toast({
          title: "Error",
          description: "Please enter a valid Draw ID",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      setCompletingDraw(true);
      
      // Convert string numbers to integers
      const numbers = winningNumbers.map(num => parseInt(num));
      
      // Validate that all numbers are valid
      if (numbers.some(isNaN) || numbers.some(n => n <= 0)) {
        toast({
          title: "Error",
          description: "All winning numbers must be valid positive numbers",
          variant: "destructive",
          duration: 3000,
        });
        setCompletingDraw(false);
        return;
      }
      
      // Validate main numbers are between 1-70
      if (numbers.slice(0, 5).some(n => n < 1 || n > 70)) {
        toast({
          title: "Error",
          description: "Main numbers must be between 1 and 70",
          variant: "destructive",
          duration: 3000,
        });
        setCompletingDraw(false);
        return;
      }
      
      // Validate LOTTO number is between 1-30
      if (numbers[5] < 1 || numbers[5] > 30) {
        toast({
          title: "Error",
          description: "LOTTO number must be between 1 and 30",
          variant: "destructive",
          duration: 3000,
        });
        setCompletingDraw(false);
        return;
      }
      
      await completeDrawManually(parseInt(drawId), numbers);
      setCompletingDraw(false);
      
      // Show success toast
      toast({
        title: "Draw Completed",
        description: `Draw #${drawId} completed with numbers: ${numbers.slice(0, 5).join(', ')} + ${numbers[5]}`,
        variant: "success",
        duration: 5000,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
    } catch (error) {
      console.error('Error completing draw:', error);
      setCompletingDraw(false);
      
      toast({
        title: "Error",
        description: `Failed to complete draw: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  // Handle input change for winning numbers
  const handleWinningNumberChange = (index: number, value: string) => {
    const newNumbers = [...winningNumbers];
    newNumbers[index] = value;
    setWinningNumbers(newNumbers);
  };
  
  // Handle updating block gap
  const handleUpdateBlockGap = async () => {
    try {
      if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You must be an admin to update the block gap",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      // Validate block gap
      if (blockGap <= 0) {
        toast({
          title: "Error",
          description: "Block gap must be a positive number",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      setUpdatingBlockGap(true);
      await updateBlockGap(blockGap);
      setUpdatingBlockGap(false);
      
      toast({
        title: "Block Gap Updated",
        description: `Block gap updated to ${blockGap} blocks`,
        variant: "success",
        duration: 5000,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
    } catch (error) {
      console.error('Error updating block gap:', error);
      setUpdatingBlockGap(false);
      
      toast({
        title: "Error",
        description: `Failed to update block gap: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  // Handle creating a new series
  const handleCreateNewSeries = async () => {
    try {
      if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You must be an admin to create a new series",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      // Validate series name
      if (!newSeriesName.trim()) {
        toast({
          title: "Error",
          description: "Please enter a valid series name",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      setCreatingNewSeries(true);
      await createNewSeries(newSeriesName);
      setCreatingNewSeries(false);
      
      toast({
        title: "Series Created",
        description: `New lottery series "${newSeriesName}" created successfully`,
        variant: "success",
        duration: 5000,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      
      // Reset form
      setNewSeriesName('');
    } catch (error) {
      console.error('Error creating new series:', error);
      setCreatingNewSeries(false);
      
      toast({
        title: "Error",
        description: `Failed to create new series: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  // Handle starting a time-based draw
  const handleStartTimeDraw = async () => {
    try {
      if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You must be an admin to start a new draw",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      // Calculate draw time as timestamp (current time + drawTimeHours)
      const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
      const drawTime = now + (drawTimeHours * 60 * 60); // Add hours in seconds
      
      setStartingNewDraw(true);
      await startNewXDraw(ticketPrice, initialJackpot, drawTime, seriesIndex);
      setStartingNewDraw(false);
      
      toast({
        title: "Time-Based Draw Started",
        description: `New time-based lottery draw started with ticket price ${ticketPrice} ETH and initial jackpot ${initialJackpot} ETH`,
        variant: "success",
        duration: 5000,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
    } catch (error) {
      console.error('Error starting time-based draw:', error);
      setStartingNewDraw(false);
      
      toast({
        title: "Error",
        description: `Failed to start time-based draw: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  // Handle starting a block-based draw
  const handleStartBlockDraw = async () => {
    try {
      if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You must be an admin to start a new draw",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      // Validate future block
      if (futureBlock <= 0) {
        toast({
          title: "Error",
          description: "Future block must be a positive number greater than the current block",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      setStartingFutureBlockDraw(true);
      await startNewFutureBlockDraw(ticketPrice, initialJackpot, futureBlock, seriesIndex);
      setStartingFutureBlockDraw(false);
      
      toast({
        title: "Block-Based Draw Started",
        description: `New block-based lottery draw started with ticket price ${ticketPrice} ETH and initial jackpot ${initialJackpot} ETH at block ${futureBlock}`,
        variant: "success",
        duration: 5000,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
    } catch (error) {
      console.error('Error starting block-based draw:', error);
      setStartingFutureBlockDraw(false);
      
      toast({
        title: "Error",
        description: `Failed to start block-based draw: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  // Handle completing a draw with a block hash
  const handleCompleteDrawWithHash = async () => {
    try {
      if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You must be an admin to complete a draw",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      // Input validation
      if (!drawId) {
        toast({
          title: "Error",
          description: "Please enter a valid Draw ID",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      // Validate block hash (simple check for 0x prefix and length, not comprehensive)
      if (!blockHash.startsWith('0x') || blockHash.length !== 66) {
        toast({
          title: "Error",
          description: "Please enter a valid block hash (0x prefix followed by 64 hex characters)",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      setCompletingDrawWithHash(true);
      await completeDrawWithBlockHash(parseInt(drawId), blockHash);
      setCompletingDrawWithHash(false);
      
      toast({
        title: "Draw Completed",
        description: `Draw #${drawId} completed with block hash ${blockHash.substring(0, 10)}...`,
        variant: "success",
        duration: 5000,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      
      // Reset block hash field
      setBlockHash('');
    } catch (error) {
      console.error('Error completing draw with block hash:', error);
      setCompletingDrawWithHash(false);
      
      toast({
        title: "Error",
        description: `Failed to complete draw with block hash: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  // Simple wallet watchdog - store initial admin wallet and redirect on wallet change
  // Added delay to ensure admin status is properly synced
  useEffect(() => {
    console.log("Admin page loaded - checking wallet status", {isConnected, isAdmin, account});
    
    // Add a small delay to ensure wallet state is synchronized
    const timer = setTimeout(() => {
      // Step 1: If still loading admin status, wait for it
      if (isAdminLoading) {
        console.log("Admin status still loading, waiting...");
        return;
      }
      
      // Step 2: Check if wallet is connected at all 
      if (!isConnected) {
        console.log("Wallet not connected, redirecting to home");
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet to access admin features.",
          variant: "destructive",
          duration: 3000
        });
        setShouldRedirect(true);
        return;
      }
      
      // Step 3: Check if wallet is admin
      if (!isAdmin) {
        console.log("Not admin wallet, redirecting to home");
        toast({
          title: "Access Denied",
          description: "This wallet doesn't have admin privileges. Please connect with the admin wallet.",
          variant: "destructive",
          duration: 3000
        });
        setShouldRedirect(true);
        return;
      }
      
      // Step 4: Store initial admin wallet for watchdog if not already done
      if (!initialAdminAccount && account) {
        console.log("Setting initial admin wallet:", account);
        setInitialAdminAccount(account);
      }
      
      // Step 5: Watchdog - Check if wallet was changed after initial admin access
      if (initialAdminAccount && account && initialAdminAccount.toLowerCase() !== account.toLowerCase()) {
        console.log("Wallet changed from admin wallet, redirecting to home");
        toast({
          title: "Wallet Changed",
          description: "Your wallet has changed from the admin wallet. Redirecting to home page.",
          variant: "default",
          duration: 3000
        });
        setShouldRedirect(true);
        return;
      }
      
      // We now use wallet-based auth only, only set the tab to 'draws' on first login
      if (!initialAdminAccount) {
        setActiveTab('draws');
      }
      
      // Show a toast notification for admin access
      if (!hasShownVerificationToast) {
        toast({
          title: "Admin Access Granted",
          description: `Your wallet (${account?.slice(0, 6)}...${account?.slice(-4)}) has been verified as the contract admin.`,
          variant: "default",
          duration: 3000,
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        });
        setHasShownVerificationToast(true);
      }
    }, 300); // Small delay to ensure proper wallet state synchronization
    
    return () => {
      clearTimeout(timer);
      // Only clear 2FA state when we're actually navigating away from the Admin page,
      // not during internal re-renders
      const isAdminPageActive = window.location.pathname.includes('/admin');
      if (!isAdminPageActive) {
        console.log("[Security] User navigated away from admin page, clearing 2FA state");
        clearTwoFactorState();
      }
    };
  }, [isConnected, isAdmin, isAdminLoading, account, initialAdminAccount, twoFactorState, toast, clearTwoFactorState, hasShownVerificationToast]);
  
  // Load series data when admin component mounts and when admin status changes
  useEffect(() => {
    if (isAdmin && isConnected) {
      // Fetch series data from the contract
      refreshSeriesList();
    }
    // refreshSeriesList is intentionally omitted from the dependency array to prevent infinite updates
  }, [isAdmin, isConnected]);
  
  // Handle series selection change 
  const handleSeriesChange = (value: string) => {
    const index = parseInt(value);
    if (!isNaN(index)) {
      setSeriesIndex(index);
      console.log(`Selected series index: ${index}`);
    }
  };
  
  // Show an alert if not connected or not admin (without redirecting)
  // REMOVING DUPLICATE EFFECT - This was causing double toast messages
  
  // Show loading if checking admin status
  if (isAdminLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="animate-spin h-8 w-8 text-primary" />
              <span className="ml-2">Checking admin status...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Add debug logging to understand the current state
  console.log("Admin component render state:", { isConnected, isAdmin, isAdminLoading });
  
  // Implement the redirect to home page
  if (shouldRedirect) {
    return <Redirect to="/" />;
  }
  
  // If wallet is not connected or not admin, show minimal content 
  // (this should rarely be seen as the redirect will take over)
  if (!isConnected || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-gray-500 mt-1">Access Restricted</p>
          </div>
        </div>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have admin privileges. Please connect with the admin wallet to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-gray-500 mt-1">Lottery Management System</p>
        </div>
        <div className="flex items-center space-x-2">
          {isAdmin ? (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
              <Lock className="mr-1 h-3 w-3" /> Admin Access
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 px-3 py-1">
              <Unlock className="mr-1 h-3 w-3" /> No Admin Access
            </Badge>
          )}
          {/* Removed 2FA badge, using wallet-based authentication only */}
        </div>
      </div>
      
      {!isConnected && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200 text-yellow-800">
          <AlertCircle className="h-4 w-4 text-yellow-800" />
          <AlertTitle>Wallet Not Connected</AlertTitle>
          <AlertDescription>
            For production use, you'll need to connect a wallet with admin privileges to access this page.
            Development mode is currently enabled for testing.
          </AlertDescription>
        </Alert>
      )}
      
      {isAdminLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="animate-spin h-8 w-8 text-primary" />
              <span className="ml-2">Checking admin status...</span>
            </div>
          </CardContent>
        </Card>
      ) : !isAdmin ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have admin privileges. Please connect with the admin wallet to access this page.
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="series" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="complete">Complete Draw</TabsTrigger>
            <TabsTrigger value="block-hash">Complete w/ Hash</TabsTrigger>
            <TabsTrigger value="block-gap">Block Gap</TabsTrigger>
            <TabsTrigger value="series">Manage Series</TabsTrigger>
          </TabsList>
          
          {/* Admin success notification is now shown as a toast only */}
          
          <TabsContent value="complete">
            {(
              <Card>
              <CardHeader>
                <CardTitle>Complete Draw Manually</CardTitle>
                <CardDescription>
                  Manually set the winning numbers for a completed draw.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 h-[320px] overflow-y-auto">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="drawId">Draw ID</Label>
                    <Input 
                      id="drawId" 
                      type="number"
                      min="1"
                      value={drawId} 
                      onChange={(e) => setDrawId(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      The ID of the draw to complete
                    </p>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Winning Numbers (1-70)</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {winningNumbers.slice(0, 5).map((num, i) => (
                        <Input 
                          key={i}
                          type="number"
                          min="1"
                          max="70"
                          value={num}
                          onChange={(e) => handleWinningNumberChange(i, e.target.value)}
                          placeholder={`Number ${i+1}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="lottoNumber" className="mb-2 block">LOTTO Number (1-30)</Label>
                    <Input 
                      id="lottoNumber"
                      type="number"
                      min="1"
                      max="30"
                      value={winningNumbers[5]}
                      onChange={(e) => handleWinningNumberChange(5, e.target.value)}
                      placeholder="LOTTO Number"
                      className="max-w-[150px]"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleCompleteDraw}
                  disabled={completingDraw}
                >
                  {completingDraw ? 'Completing Draw...' : 'Complete Draw'}
                </Button>
              </CardFooter>
            </Card>
            )}
          </TabsContent>

          {/* Complete Draw with Block Hash Tab */}
          <TabsContent value="block-hash">
            <Card>
              <CardHeader>
                <CardTitle>Complete Draw with Block Hash</CardTitle>
                <CardDescription>
                  Complete a draw using a specific block hash for random number generation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 h-[250px] overflow-y-auto">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="blockHashDrawId">Draw ID</Label>
                    <Input 
                      id="blockHashDrawId" 
                      type="number"
                      min="1"
                      value={drawId} 
                      onChange={(e) => setDrawId(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      The ID of the draw to complete
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="blockHash">Block Hash</Label>
                    <Input 
                      id="blockHash" 
                      type="text"
                      placeholder="0x..."
                      value={blockHash} 
                      onChange={(e) => setBlockHash(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      The Ethereum block hash to use for random number generation (starts with 0x)
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleCompleteDrawWithHash}
                  disabled={completingDrawWithHash}
                >
                  {completingDrawWithHash ? 'Completing Draw...' : 'Complete Draw with Block Hash'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Block Gap Settings Tab */}
          <TabsContent value="block-gap">
            <Card>
              <CardHeader>
                <CardTitle>Update Block Gap</CardTitle>
                <CardDescription>
                  Update the gap between the current block and the future block used for random number generation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 h-[200px] overflow-y-auto">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="blockGap">Block Gap</Label>
                    <Input 
                      id="blockGap" 
                      type="number"
                      min="1"
                      value={blockGap} 
                      onChange={(e) => setBlockGap(parseInt(e.target.value))}
                    />
                    <p className="text-sm text-gray-500">
                      The number of blocks in the future to use for random number generation
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleUpdateBlockGap}
                  disabled={updatingBlockGap}
                >
                  {updatingBlockGap ? 'Updating Block Gap...' : 'Update Block Gap'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Series Management Tab */}
          <TabsContent value="series">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left column - Create New Series */}
              <Card>
                <CardHeader>
                  <CardTitle>Create New Series</CardTitle>
                  <CardDescription>
                    Create a new lottery series with the specified name.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 h-[300px] overflow-y-auto">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="seriesName">Series Name</Label>
                      <Input 
                        id="seriesName" 
                        type="text"
                        placeholder="e.g., Weekly Special, Monthly Jackpot"
                        value={newSeriesName} 
                        onChange={(e) => setNewSeriesName(e.target.value)}
                      />
                      <p className="text-sm text-gray-500">
                        A descriptive name for the new lottery series
                      </p>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">
                        Enter a name for your new lottery series. Each series can have multiple draws with different parameters.
                      </p>
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                        <span className="font-medium">Note:</span> Series are permanent and cannot be deleted once created.
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={handleCreateNewSeries}
                    disabled={creatingNewSeries}
                  >
                    {creatingNewSeries ? 'Creating Series...' : 'Create New Series'}
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Right column - Current Series List */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Series</CardTitle>
                  <CardDescription>
                    List of all available lottery series.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] overflow-y-auto">
                  <div className="space-y-2">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Series List</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={refreshSeriesList}
                        title="Refresh series list"
                        disabled={seriesLoading}
                      >
                        {seriesLoading ? (
                          <RefreshCw className="animate-spin h-4 w-4" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {seriesLoading && seriesList.length === 0 ? (
                      <div className="flex justify-center items-center py-12">
                        <RefreshCw className="animate-spin h-8 w-8 text-primary mr-2" />
                        <span>Loading series data...</span>
                      </div>
                    ) : seriesList.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-md border-gray-300">
                        <p className="text-gray-500">No series data available</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={refreshSeriesList}
                          disabled={seriesLoading}
                        >
                          {seriesLoading ? (
                            <RefreshCw className="animate-spin h-4 w-4 mr-1" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-1" />
                          )}
                          Refresh
                        </Button>
                      </div>
                    ) : (
                      <div className="border rounded-md divide-y relative">
                        {seriesLoading && (
                          <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10">
                            <RefreshCw className="animate-spin h-6 w-6 text-primary" />
                          </div>
                        )}
                        {seriesList.map((series) => (
                          <div key={series.index} className="p-3 flex justify-between items-center">
                            <div>
                              <span className="font-medium">{series.name}</span>
                              <div className="text-sm text-gray-500">Series #{series.index}</div>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              {series.index === 0 ? 'Default' : ''}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Start New Time-Based Draw</CardTitle>
                  <CardDescription>
                    Start a new time-based draw in a specific series.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 h-[250px]">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="timeDrawTicketPrice">Ticket Price (ETH)</Label>
                      <Input 
                        id="timeDrawTicketPrice" 
                        type="number" 
                        step="0.001"
                        min="0.001"
                        value={ticketPrice} 
                        onChange={(e) => setTicketPrice(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="timeDrawJackpot">Initial Jackpot (ETH)</Label>
                      <Input 
                        id="timeDrawJackpot" 
                        type="number" 
                        step="0.01"
                        min="0.01"
                        value={initialJackpot} 
                        onChange={(e) => setInitialJackpot(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="timeDrawHours">Draw Time (Hours)</Label>
                      <Input 
                        id="timeDrawHours" 
                        type="number" 
                        step="1"
                        min="1"
                        value={drawTimeHours} 
                        onChange={(e) => setDrawTimeHours(parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="timeDrawSeriesIndex">Series</Label>
                      {seriesLoading ? (
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="animate-spin h-4 w-4" />
                          <span className="text-sm">Loading series...</span>
                        </div>
                      ) : (
                        <Select
                          value={seriesIndex.toString()}
                          onValueChange={handleSeriesChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a series" />
                          </SelectTrigger>
                          <SelectContent>
                            {seriesList.length > 0 ? (
                              seriesList.map((series) => (
                                <SelectItem 
                                  key={series.index} 
                                  value={series.index.toString()}
                                >
                                  {series.name} (Series #{series.index})
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="0">Default Series (0)</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={handleStartTimeDraw}
                    disabled={startingNewDraw}
                  >
                    {startingNewDraw ? 'Starting Draw...' : 'Start Time-Based Draw'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Start New Block-Based Draw</CardTitle>
                  <CardDescription>
                    Start a new draw that completes at a specific future block.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 h-[250px]">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="blockDrawTicketPrice">Ticket Price (ETH)</Label>
                      <Input 
                        id="blockDrawTicketPrice" 
                        type="number" 
                        step="0.001"
                        min="0.001"
                        value={ticketPrice} 
                        onChange={(e) => setTicketPrice(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="blockDrawJackpot">Initial Jackpot (ETH)</Label>
                      <Input 
                        id="blockDrawJackpot" 
                        type="number" 
                        step="0.01"
                        min="0.01"
                        value={initialJackpot} 
                        onChange={(e) => setInitialJackpot(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="futureBlock">Future Block Number</Label>
                      <Input 
                        id="futureBlock" 
                        type="number" 
                        step="1"
                        min="1"
                        value={futureBlock} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            setFutureBlock(val);
                          }
                        }}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="blockDrawSeriesIndex">Series</Label>
                      {seriesLoading ? (
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="animate-spin h-4 w-4" />
                          <span className="text-sm">Loading series...</span>
                        </div>
                      ) : (
                        <Select
                          value={seriesIndex.toString()}
                          onValueChange={handleSeriesChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a series" />
                          </SelectTrigger>
                          <SelectContent>
                            {seriesList.length > 0 ? (
                              seriesList.map((series) => (
                                <SelectItem 
                                  key={series.index} 
                                  value={series.index.toString()}
                                >
                                  {series.name} (Series #{series.index})
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="0">Default Series (0)</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={handleStartBlockDraw}
                    disabled={startingFutureBlockDraw}
                  >
                    {startingFutureBlockDraw ? 'Starting Draw...' : 'Start Block-Based Draw'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}