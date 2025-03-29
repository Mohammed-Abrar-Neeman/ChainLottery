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
  
  const [activeTab, setActiveTab] = useState('overview');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  
  // New draw form state
  const [ticketPrice, setTicketPrice] = useState('0.01');
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
      
      setVerifying2FA(true);
      const result = await verifyTwoFactor(twoFactorCode);
      setVerifying2FA(false);
      
      if (result) {
        // Show success toast with CheckCircle icon
        toast({
          title: "Verification successful!",
          description: "Your two-factor authentication has been verified successfully.",
          variant: "success",
          duration: 5000,
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        });
        
        // Navigate to the admin overview
        setActiveTab('overview');
      } else {
        toast({
          title: "Verification failed",
          description: "Invalid code. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
        setTwoFactorCode('');
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      setVerifying2FA(false);
      
      toast({
        title: "Error",
        description: "Error verifying code. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  // Handle starting a new draw
  const handleStartNewDraw = async () => {
    try {
      // Double check admin status and 2FA before proceeding
      if (!isAdmin || twoFactorState !== 'verified') {
        toast({
          title: "Access Denied",
          description: "You must be an admin with verified 2FA to start a new draw",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      setStartingNewDraw(true);
      await startNewDraw(ticketPrice, useFutureBlock);
      setStartingNewDraw(false);
      
      // Show success toast
      toast({
        title: "Draw Started",
        description: `New lottery draw started with ticket price ${ticketPrice} ETH`,
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
      // Double check admin status and 2FA before proceeding
      if (!isAdmin || twoFactorState !== 'verified') {
        toast({
          title: "Access Denied",
          description: "You must be an admin with verified 2FA to complete a draw",
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
      
      // Step 6: Force 2FA verification if not already verified
      if (twoFactorState !== 'verified') {
        console.log("2FA not verified, showing security tab");
        // If 2FA not set up yet, make sure we show the security tab
        if (twoFactorState === 'not-setup') {
          setActiveTab('security');
        } else if (twoFactorState === 'setup') {
          // If 2FA is set up but not verified, show security tab for verification
          setActiveTab('security');
          toast({
            title: "Verification Required",
            description: "Please complete two-factor authentication to access admin functionality.",
            variant: "default",
            duration: 3000
          });
        }
      }
    }, 300); // Small delay to ensure proper wallet state synchronization
    
    return () => {
      clearTimeout(timer);
      console.log("[Security] User navigated away from admin page, clearing 2FA state");
      clearTwoFactorState();
    };
  }, [isConnected, isAdmin, isAdminLoading, account, initialAdminAccount, twoFactorState, toast, clearTwoFactorState]);
  
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
          {twoFactorState === 'verified' && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
              <KeyRound className="mr-1 h-3 w-3" /> 2FA Verified
            </Badge>
          )}
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
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="security" disabled={twoFactorState === 'verified'}>Security</TabsTrigger>
            <TabsTrigger value="draws" disabled={twoFactorState !== 'verified'}>Manage Draws</TabsTrigger>
            <TabsTrigger value="complete" disabled={twoFactorState !== 'verified'}>Complete Draw</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Lottery Admin Dashboard</CardTitle>
                <CardDescription>
                  Welcome to the lottery admin dashboard. From here you can manage the lottery draws.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Two-Factor Authentication
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {twoFactorState === 'not-setup' ? 'Not Setup' : 
                           twoFactorState === 'setup' ? 'Setup Incomplete' : 'Verified'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {twoFactorState === 'not-setup' ? 'Setup 2FA for added security' : 
                           twoFactorState === 'setup' ? 'Verify your 2FA to access admin functions' : 
                           'You have full access to admin functions'}
                        </p>
                      </CardContent>
                      <CardFooter>
                        {twoFactorState === 'not-setup' ? (
                          <Button 
                            size="sm" 
                            onClick={() => setActiveTab('security')}
                            className="w-full"
                          >
                            Setup 2FA <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        ) : twoFactorState === 'setup' ? (
                          <Button 
                            size="sm" 
                            onClick={() => setActiveTab('security')}
                            className="w-full"
                          >
                            Verify 2FA <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => setActiveTab('draws')}
                            className="w-full"
                          >
                            Manage Draws <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                    
                    {/* Additional stat cards can be added here */}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Set up two-factor authentication to secure your admin account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {twoFactorState === 'not-setup' ? (
                  <div>
                    <p className="mb-4">
                      Two-factor authentication adds an extra layer of security to your admin account.
                      When enabled, you'll need both your wallet and an authentication code to access admin functions.
                    </p>
                    <Button onClick={handleSetup2FA} disabled={setupLoading}>
                      {setupLoading ? 'Setting up...' : 'Setup Two-Factor Authentication'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Scan QR Code</h3>
                      <p className="mb-4">
                        Scan this QR code with your authenticator app (like Google Authenticator or Authy).
                      </p>
                      {twoFactorQrCode && (
                        <div className="border rounded-md p-4 inline-block bg-white">
                          <img src={twoFactorQrCode} alt="2FA QR Code" width={200} height={200} />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Or Enter Secret Key</h3>
                      <p className="mb-4">
                        If you can't scan the QR code, enter this secret key in your authenticator app.
                      </p>
                      <div className="bg-gray-100 p-3 rounded-md font-mono text-center">
                        {twoFactorSecret}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Verify Setup</h3>
                      <p className="mb-4">
                        Enter the verification code from your authenticator app to verify setup.
                      </p>
                      <div className="flex space-x-2">
                        <Input 
                          type="text" 
                          placeholder="Enter 6-digit code" 
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value)}
                          className="max-w-xs"
                        />
                        <Button onClick={handleVerify2FA} disabled={verifying2FA}>
                          {verifying2FA ? 'Verifying...' : 'Verify'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="draws">
            {twoFactorState !== 'verified' ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Required</AlertTitle>
                <AlertDescription>
                  You must complete two-factor authentication before accessing this feature.
                  Please go to the Security tab to set up and verify your authenticator.
                </AlertDescription>
              </Alert>
            ) : (
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
            {twoFactorState !== 'verified' ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Required</AlertTitle>
                <AlertDescription>
                  You must complete two-factor authentication before accessing this feature.
                  Please go to the Security tab to set up and verify your authenticator.
                </AlertDescription>
              </Alert>
            ) : (
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