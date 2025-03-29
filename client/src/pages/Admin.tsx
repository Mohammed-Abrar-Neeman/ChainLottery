import React, { useState } from 'react';
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
import { AlertCircle, KeyRound, ChevronRight, Lock, Unlock, RefreshCw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function Admin() {
  const { isConnected } = useWallet();
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
    completeDrawManually
  } = useAdmin();
  
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
  
  // Handle 2FA setup
  const handleSetup2FA = async () => {
    try {
      setSetupLoading(true);
      await setupTwoFactor();
      setSetupLoading(false);
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      setSetupLoading(false);
    }
  };
  
  // Handle 2FA verification
  const handleVerify2FA = async () => {
    try {
      setVerifying2FA(true);
      const result = await verifyTwoFactor(twoFactorCode);
      setVerifying2FA(false);
      
      if (!result) {
        alert('Invalid code. Please try again.');
        setTwoFactorCode('');
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      setVerifying2FA(false);
      alert('Error verifying code. Please try again.');
    }
  };
  
  // Handle starting a new draw
  const handleStartNewDraw = async () => {
    try {
      setStartingNewDraw(true);
      await startNewDraw(ticketPrice, useFutureBlock);
      setStartingNewDraw(false);
    } catch (error) {
      console.error('Error starting new draw:', error);
      setStartingNewDraw(false);
    }
  };
  
  // Handle completing a draw manually
  const handleCompleteDraw = async () => {
    try {
      setCompletingDraw(true);
      
      // Convert string numbers to integers
      const numbers = winningNumbers.map(num => parseInt(num));
      
      // Validate that all numbers are valid
      if (numbers.some(isNaN)) {
        alert('All winning numbers must be valid numbers');
        setCompletingDraw(false);
        return;
      }
      
      await completeDrawManually(parseInt(drawId), numbers);
      setCompletingDraw(false);
    } catch (error) {
      console.error('Error completing draw:', error);
      setCompletingDraw(false);
    }
  };
  
  // Handle input change for winning numbers
  const handleWinningNumberChange = (index: number, value: string) => {
    const newNumbers = [...winningNumbers];
    newNumbers[index] = value;
    setWinningNumbers(newNumbers);
  };
  
  // For development, we're allowing access without wallet connection
  // if (!isConnected) {
  //   return <Redirect to="/" />;
  // }
  
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
          </TabsContent>
          
          <TabsContent value="complete">
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
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}