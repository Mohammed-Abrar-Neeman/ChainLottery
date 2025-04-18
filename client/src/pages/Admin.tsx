import React, { useState, useEffect } from 'react';
import { Redirect } from 'wouter';
import { useWallet } from '@/hooks/useWallet';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    setupTwoFactor,
    verifyTwoFactor,
    startNewDraw,
    completeDrawManually,
    clearTwoFactorState
  } = useAdmin();
  
  // Wallet watchdog - simple approach
  const [initialAdminAccount, setInitialAdminAccount] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  // Initialize toast
  const { toast } = useToast();
  
  // Track if we've already shown the 2FA verification toast
  const [hasShownVerificationToast, setHasShownVerificationToast] = useState(false);
  
  const [activeTab, setActiveTab] = useState('draws');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  
  // New draw form state
  const [ticketPrice, setTicketPrice] = useState('0.01');
  const [initialJackpot, setInitialJackpot] = useState('0.1');
  const [drawTimeHours, setDrawTimeHours] = useState(48); // 48 hours from now
  const [seriesIndex, setSeriesIndex] = useState(0); // Default to first series
  const [useFutureBlock, setUseFutureBlock] = useState(true);
  const [startingNewDraw, setStartingNewDraw] = useState(false);
  
  // Complete draw form state
  const [drawId, setDrawId] = useState('');
  const [winningNumbers, setWinningNumbers] = useState(['', '', '', '', '', '']);
  const [completingDraw, setCompletingDraw] = useState(false);
  
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
        
        // Navigate to the Manage Draws tab
        setActiveTab('draws');
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
          
          // Navigate to the Manage Draws tab
          setActiveTab('draws');
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
  
  // Handle starting a new draw
  const handleStartNewDraw = async () => {
    try {
      // Double check admin status before proceeding
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
      await startNewDraw(ticketPrice, initialJackpot, drawTime, seriesIndex, useFutureBlock);
      setStartingNewDraw(false);
      
      // Show success toast
      toast({
        title: "Draw Started",
        description: `New lottery draw started with ticket price ${ticketPrice} ETH and initial jackpot ${initialJackpot} ETH`,
        variant: "success",
        duration: 5000,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
    } catch (error) {
      console.error('Error starting new draw:', error);
      setStartingNewDraw(false);
      
      toast({
        title: "Error",
        description: `Failed to start new draw: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
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
      
      // We now use wallet-based auth only, so we'll just set the active tab to 'draws'
      setActiveTab('draws');
      
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
        <Tabs defaultValue="draws" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="draws">Manage Draws</TabsTrigger>
            <TabsTrigger value="complete">Complete Draw</TabsTrigger>
          </TabsList>
          
          {/* Admin success notification is now shown as a toast only */}
          
          <TabsContent value="draws">
            {(
              <Card>
              <CardHeader>
                <CardTitle>Start New Lottery Draw</CardTitle>
                <CardDescription>
                  Create a new lottery draw with the specified parameters.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="ticketPrice">Ticket Price (ETH)</Label>
                    <Input 
                      id="ticketPrice" 
                      type="number" 
                      step="0.001"
                      min="0.001"
                      value={ticketPrice} 
                      onChange={(e) => setTicketPrice(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      The price of each lottery ticket in ETH
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="initialJackpot">Initial Jackpot (ETH)</Label>
                    <Input 
                      id="initialJackpot" 
                      type="number" 
                      step="0.01"
                      min="0.01"
                      value={initialJackpot} 
                      onChange={(e) => setInitialJackpot(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      The initial jackpot amount in ETH
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="drawTimeHours">Draw Time (Hours from now)</Label>
                    <Input 
                      id="drawTimeHours" 
                      type="number" 
                      step="1"
                      min="1"
                      value={drawTimeHours} 
                      onChange={(e) => setDrawTimeHours(parseInt(e.target.value))}
                    />
                    <p className="text-sm text-gray-500">
                      The time when the draw will take place, specified in hours from now
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="seriesIndex">Series Index</Label>
                    <Input 
                      id="seriesIndex" 
                      type="number" 
                      step="1"
                      min="0"
                      value={seriesIndex} 
                      onChange={(e) => setSeriesIndex(parseInt(e.target.value))}
                    />
                    <p className="text-sm text-gray-500">
                      The index of the series for this draw (start with 0 if no series exist)
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="useFutureBlock" 
                      checked={useFutureBlock}
                      onCheckedChange={setUseFutureBlock}
                    />
                    <Label htmlFor="useFutureBlock">Use future block for random number generation</Label>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-2">
                      {useFutureBlock 
                        ? 'The winning numbers will be automatically generated from a future block hash.'
                        : 'You will need to manually set the winning numbers when the draw is complete.'}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleStartNewDraw}
                  disabled={startingNewDraw}
                >
                  {startingNewDraw ? 'Starting New Draw...' : 'Start New Draw'}
                </Button>
              </CardFooter>
            </Card>
            )}
          </TabsContent>
          
          <TabsContent value="complete">
            {(
              <Card>
              <CardHeader>
                <CardTitle>Complete Draw Manually</CardTitle>
                <CardDescription>
                  Manually set the winning numbers for a completed draw.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
        </Tabs>
      )}
    </div>
  );
}