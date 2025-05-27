import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, KeyRound, ChevronRight, Lock, Unlock, RefreshCw, CheckCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useAppKitProvider, useAppKitAccount } from "@reown/appkit/react";
import { BrowserProvider, Contract } from "ethers";
import { CONTRACTS, LOTTERY_ABI } from '@/config/contracts';
import { ethers } from 'ethers';

export default function Admin() {
  // Initialize toast
  const { toast } = useToast();
  const { settings, updateShowSeriesDropdown } = useAppSettings();
  
  // Basic state management
  const [activeTab, setActiveTab] = useState('series');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // AppKit hooks
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  // Add currentBlock state
  const [currentBlock, setCurrentBlock] = useState<number | null>(null);

  // Check admin status
  const checkAdminStatus = async () => {
    if (!isConnected || !address || !walletProvider) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    try {
      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();
      const lotteryContract = new Contract(
        CONTRACTS.LOTTERY,
        LOTTERY_ABI,
        signer
      );

      const adminAddress = await lotteryContract.admin();
      setIsAdmin(adminAddress.toLowerCase() === address.toLowerCase());
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      toast({
        title: "Error",
        description: "Failed to check admin status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to check admin status when connection changes
  useEffect(() => {
    checkAdminStatus();
  }, [isConnected, address, walletProvider]);

  // Draw form state
  const [ticketPrice, setTicketPrice] = useState('0.01');
  const [initialJackpot, setInitialJackpot] = useState('0.1');
  const [drawTimeHours, setDrawTimeHours] = useState(48);
  const [seriesIndex, setSeriesIndex] = useState(0);
  const [futureBlock, setFutureBlock] = useState(0);
  
  // Complete draw form state
  const [drawId, setDrawId] = useState('');
  const [winningNumbers, setWinningNumbers] = useState(['', '', '', '', '', '']);
  const [blockHash, setBlockHash] = useState('');
  
  // Series management state
  const [newSeriesName, setNewSeriesName] = useState('');
  const [seriesList, setSeriesList] = useState([
    { index: 0, name: 'Default Series' },
    { index: 1, name: 'Weekly Special' },
    { index: 2, name: 'Monthly Jackpot' }
  ]);
  
  // Settings state
  const [showSeriesDropdown, setShowSeriesDropdown] = useState(true);
  
  // Add state for block gap
  const [blockGap, setBlockGap] = useState<number>(0);
  const [currentBlockGap, setCurrentBlockGap] = useState<number>(0);

  // Function to get current block gap
  const getCurrentBlockGap = async () => {
    try {
      const contract = await getContract();
      if (!contract) throw new Error("Contract not initialized");
      
      const gap = await contract.blockGapInSeconds();
      setCurrentBlockGap(Number(gap));
    } catch (error) {
      console.error('Error getting block gap:', error);
      toast({
        title: "Error",
        description: "Failed to get current block gap",
        variant: "destructive",
      });
    }
  };

  // Effect to get current block gap when connected
  useEffect(() => {
    if (isConnected && isAdmin) {
      getCurrentBlockGap();
    }
  }, [isConnected, isAdmin]);

  // Handle winning number changes
  const handleWinningNumberChange = (index: number, value: string) => {
    const newNumbers = [...winningNumbers];
    newNumbers[index] = value;
    setWinningNumbers(newNumbers);
  };
  
  // Handle series selection
  const handleSeriesChange = (value: string) => {
    setSeriesIndex(parseInt(value));
  };
  
  // Update getContract to also get current block
  const getContract = async () => {
    if (!isConnected || !address || !walletProvider) return null;
    const ethersProvider = new BrowserProvider(walletProvider);
    const signer = await ethersProvider.getSigner();
    const provider = signer.provider;
    if (provider) {
      const block = await provider.getBlockNumber();
      setCurrentBlock(block);
    }
    return new Contract(CONTRACTS.LOTTERY, LOTTERY_ABI, signer);
  };

  // Update validation functions
  const validateTicketPrice = (price: string) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      throw new Error("Ticket price must be greater than 0");
    }
    return true;
  };

  const validateDrawTime = (hours: number) => {
    const currentTime = Math.floor(Date.now() / 1000);
    const drawTime = currentTime + (hours * 3600);
    
    if (drawTime <= currentTime) {
      throw new Error("Draw time must be in the future");
    }
    return true;
  };

  const validateSeriesIndex = async (index: number) => {
    const contract = await getContract();
    if (!contract) throw new Error("Contract not initialized");
    
    const totalSeries = await contract.getTotalSeries();
    if (index >= totalSeries) {
      throw new Error("Invalid series index");
    }
    return true;
  };

  // Updated handler for time-based draw
  const handleStartTimeDraw = async () => {
    try {
      // Validate inputs
      validateTicketPrice(ticketPrice);
      validateDrawTime(drawTimeHours);
      await validateSeriesIndex(seriesIndex);

      const contract = await getContract();
      if (!contract) throw new Error("Contract not initialized");

      const ticketPriceWei = ethers.parseEther(ticketPrice);
      const initialJackpotWei = ethers.parseEther(initialJackpot || "0");
      const drawTime = Math.floor(Date.now() / 1000) + (drawTimeHours * 3600);

      const tx = await contract.startNewXDraw(
        ticketPriceWei,
        initialJackpotWei,
        drawTime,
        seriesIndex
      );

      await tx.wait();
      toast({
        title: "Draw Started",
        description: "Time-based draw has been started successfully",
        variant: "success",
      });
    } catch (error) {
      console.error('Error starting time-based draw:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start time-based draw. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Validation functions
  const validateJackpot = (jackpot: string) => {
    const numJackpot = parseFloat(jackpot);
    if (isNaN(numJackpot) || numJackpot <= 0) {
      throw new Error("Initial jackpot must be greater than 0");
    }
    return true;
  };

  const validateFutureBlock = async (block: number) => {
    const contract = await getContract();
    if (!contract) throw new Error("Contract not initialized");
    
    const provider = contract.runner?.provider;
    if (!provider) throw new Error("Failed to get provider");
    
    const currentBlock = await provider.getBlockNumber();
    console.log('Debug block numbers:', {
      inputBlock: block,
      currentBlock: currentBlock,
      requiredBlock: currentBlock + 100,
      difference: block - currentBlock
    });

    // Check if the input block is at least 100 blocks ahead
    if (block - currentBlock < 100) {
      throw new Error(`Future block must be at least 100 blocks ahead. Current block: ${currentBlock}, minimum required: ${currentBlock + 100}`);
    }
    return true;
  };

  const validateWinningNumbers = (numbers: string[]) => {
    if (numbers.length !== 6) {
      throw new Error("Must provide exactly 6 winning numbers");
    }

    // Validate first 5 numbers (1-70)
    for (let i = 0; i < 5; i++) {
      const num = parseInt(numbers[i]);
      if (isNaN(num) || num < 1 || num > 70) {
        throw new Error(`Number ${i + 1} must be between 1 and 70`);
      }
    }

    // Validate LOTTO number (1-30)
    const lottoNum = parseInt(numbers[5]);
    if (isNaN(lottoNum) || lottoNum < 1 || lottoNum > 30) {
      throw new Error("LOTTO number must be between 1 and 30");
    }

    return true;
  };

  const validateBlockHash = (hash: string) => {
    if (!hash.startsWith('0x') || hash.length !== 66) {
      throw new Error("Invalid block hash format");
    }
    return true;
  };

  const validateSeriesName = (name: string) => {
    if (!name || name.trim().length === 0) {
      throw new Error("Series name cannot be empty");
    }
    if (name.length > 50) {
      throw new Error("Series name must be less than 50 characters");
    }
    return true;
  };

  const validateBlockGap = (gap: number) => {
    if (gap <= 0) {
      throw new Error("Block gap must be greater than 0");
    }
    return true;
  };

  // Updated handler functions with validations
  const handleStartBlockDraw = async () => {
    try {
      // Validate inputs
      validateTicketPrice(ticketPrice);
      await validateFutureBlock(futureBlock);
      await validateSeriesIndex(seriesIndex);

      const contract = await getContract();
      if (!contract) throw new Error("Contract not initialized");

      const ticketPriceWei = ethers.parseEther(ticketPrice);
      const initialJackpotWei = ethers.parseEther(initialJackpot || "0");

      const tx = await contract.startNewFutureBlockDraw(
        ticketPriceWei,
        initialJackpotWei,
        futureBlock,
        seriesIndex
      );

      await tx.wait();
      toast({
        title: "Draw Started",
        description: "Block-based draw has been started successfully",
        variant: "success",
      });
    } catch (error) {
      console.error('Error starting block-based draw:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start block-based draw. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteDraw = async () => {
    try {
      // Validate inputs
      if (!drawId) throw new Error("Draw ID is required");
      validateWinningNumbers(winningNumbers);

      const contract = await getContract();
      if (!contract) throw new Error("Contract not initialized");

      const winningNumbersArray = winningNumbers.map(num => parseInt(num));
      
      const tx = await contract.completeDrawManually(
        parseInt(drawId),
        winningNumbersArray
      );

      await tx.wait();
      toast({
        title: "Draw Completed",
        description: "Draw has been completed successfully",
        variant: "success",
      });
    } catch (error) {
      console.error('Error completing draw:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete draw. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteDrawWithHash = async () => {
    try {
      // Validate inputs
      if (!drawId) throw new Error("Draw ID is required");
      validateBlockHash(blockHash);

      const contract = await getContract();
      if (!contract) throw new Error("Contract not initialized");

      const tx = await contract.completeDrawWithBlockHash(
        parseInt(drawId),
        blockHash
      );

      await tx.wait();
      toast({
        title: "Draw Completed",
        description: "Draw has been completed with block hash successfully",
        variant: "success",
      });
    } catch (error) {
      console.error('Error completing draw with block hash:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete draw with block hash. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateNewSeries = async () => {
    try {
      // Validate inputs
      validateSeriesName(newSeriesName);

      const contract = await getContract();
      if (!contract) throw new Error("Contract not initialized");

      const tx = await contract.newSeries(newSeriesName);
      await tx.wait();

      // Refresh series list
      await refreshSeriesList();
      setNewSeriesName('');

      toast({
        title: "Series Created",
        description: "New series has been created successfully",
        variant: "success",
      });
    } catch (error) {
      console.error('Error creating new series:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create new series. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBlockGap = async (newGap: number) => {
    try {
      // Validate inputs
      validateBlockGap(newGap);

      const contract = await getContract();
      if (!contract) throw new Error("Contract not initialized");

      const tx = await contract.updateBlockGap(newGap);
      await tx.wait();

      toast({
        title: "Block Gap Updated",
        description: "Block gap settings have been updated successfully",
        variant: "success",
      });
    } catch (error) {
      console.error('Error updating block gap:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update block gap. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Refresh series list
  const refreshSeriesList = async () => {
    try {
      const contract = await getContract();
      if (!contract) throw new Error("Contract not initialized");

      const totalSeries = await contract.getTotalSeries();
      const updatedSeriesList = [];
      
      for (let i = 0; i < totalSeries; i++) {
        const name = await contract.getSeriesNameByIndex(i);
        updatedSeriesList.push({ index: i, name });
      }
      
      setSeriesList(updatedSeriesList);
    } catch (error) {
      console.error('Error refreshing series list:', error);
      toast({
        title: "Error",
        description: "Failed to refresh series list. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Effect to refresh series list when connected
  useEffect(() => {
    if (isConnected && isAdmin) {
      refreshSeriesList();
    }
  }, [isConnected, isAdmin]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="animate-spin h-8 w-8 text-primary" />
              <span className="ml-2">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show connect wallet message if not connected
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-gray-500 mt-1">Access Restricted</p>
          </div>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wallet Not Connected</AlertTitle>
          <AlertDescription>
            Please connect your wallet to access the admin panel.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Show access denied if not admin
  if (!isAdmin) {
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
            You do not have permission to access this page. Only the contract admin can access this panel.
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
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
            <Lock className="mr-1 h-3 w-3" /> Admin Access
          </Badge>
        </div>
      </div>
      
      <Tabs defaultValue="series" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="complete">Complete Draw</TabsTrigger>
          <TabsTrigger value="block-hash">Complete w/ Hash</TabsTrigger>
          <TabsTrigger value="block-gap">Block Gap</TabsTrigger>
          <TabsTrigger value="series">Manage Series</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        {/* Complete Draw Tab */}
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
              >
                Complete Draw
              </Button>
            </CardFooter>
          </Card>
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
            <CardContent className="space-y-4">
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
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleCompleteDrawWithHash}
              >
                Complete Draw with Block Hash
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Block Gap Tab */}
        <TabsContent value="block-gap">
          <Card>
            <CardHeader>
              <CardTitle>Block Gap Settings</CardTitle>
              <CardDescription>
                Configure the minimum number of blocks required between draws
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="blockGap">Block Gap (in seconds)</Label>
                  <div className="space-y-1">
                    <Input 
                      id="blockGap" 
                      type="number"
                      min="1"
                      value={blockGap} 
                      onChange={(e) => setBlockGap(parseInt(e.target.value))}
                      placeholder="Enter block gap in seconds"
                    />
                    <p className="text-sm text-muted-foreground">
                      Current block gap: {currentBlockGap} seconds
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={async () => {
                  try {
                    if (blockGap <= 0) {
                      throw new Error("Block gap must be greater than 0");
                    }

                    const contract = await getContract();
                    if (!contract) throw new Error("Contract not initialized");

                    const tx = await contract.updateBlockGap(blockGap);
                    await tx.wait();

                    // Refresh current block gap
                    await getCurrentBlockGap();
                    
                    toast({
                      title: "Success",
                      description: "Block gap settings have been updated successfully",
                      variant: "success",
                    });
                  } catch (error) {
                    console.error('Error updating block gap:', error);
                    toast({
                      title: "Error",
                      description: error instanceof Error ? error.message : "Failed to update block gap",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Update Block Gap
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Series Management Tab */}
        <TabsContent value="series">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Create New Series */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Series</CardTitle>
                <CardDescription>
                  Create a new lottery series with the specified name.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleCreateNewSeries}
                >
                  Create New Series
                </Button>
              </CardFooter>
            </Card>
            
            {/* Current Series List */}
            <Card>
              <CardHeader>
                <CardTitle>Current Series</CardTitle>
                <CardDescription>
                  List of all available lottery series.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="border rounded-md divide-y">
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
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Start New Draws */}
          <div className="mt-4 grid gap-4">
            {/* Time-Based Draw */}
            <Card>
              <CardHeader>
                <CardTitle>Start New Time-Based Draw</CardTitle>
                <CardDescription>
                  Start a new time-based draw in a specific series.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <Select
                      value={seriesIndex.toString()}
                      onValueChange={handleSeriesChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a series" />
                      </SelectTrigger>
                      <SelectContent>
                        {seriesList.map((series) => (
                          <SelectItem 
                            key={series.index} 
                            value={series.index.toString()}
                          >
                            {series.name} (Series #{series.index})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleStartTimeDraw}
                >
                  Start Time-Based Draw
                </Button>
              </CardFooter>
            </Card>
            
            {/* Block-Based Draw */}
            <Card>
              <CardHeader>
                <CardTitle>Start New Block-Based Draw</CardTitle>
                <CardDescription>
                  Start a new draw that completes at a specific future block.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <div className="space-y-1">
                      <Input 
                        id="futureBlock" 
                        type="number" 
                        step="1"
                        min="1"
                        value={futureBlock} 
                        onChange={(e) => setFutureBlock(parseInt(e.target.value))}
                        placeholder="Enter future block number"
                      />
                      <p className="text-sm text-muted-foreground">
                        Current block: {currentBlock || 'Loading...'}, Minimum required: {currentBlock ? currentBlock + 100 : 'Loading...'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="blockDrawSeriesIndex">Series</Label>
                    <Select
                      value={seriesIndex.toString()}
                      onValueChange={handleSeriesChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a series" />
                      </SelectTrigger>
                      <SelectContent>
                        {seriesList.map((series) => (
                          <SelectItem 
                            key={series.index} 
                            value={series.index.toString()}
                          >
                            {series.name} (Series #{series.index})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleStartBlockDraw}
                >
                  Start Block-Based Draw
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>UI Settings</CardTitle>
              <CardDescription>
                Configure display options for the lottery interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-series" className="font-medium">Show Series Dropdown</Label>
                    <p className="text-sm text-muted-foreground">
                      When disabled, users will only see the selected draw date instead of series selection
                    </p>
                  </div>
                  <Switch 
                    id="show-series" 
                    className="ml-4"
                    checked={settings.showSeriesDropdown}
                    onCheckedChange={async (checked) => {
                      try {
                        // Update the setting via context
                        await updateShowSeriesDropdown(checked);
                        console.log("Series dropdown visibility changed to:", checked);
                        
                        // Show toast notification
                        toast({
                          title: "Setting Updated",
                          description: `Series dropdown will now be ${checked ? 'shown' : 'hidden'} to users`,
                          duration: 3000,
                        });
                      } catch (error) {
                        console.error("Error updating series dropdown setting:", error);
                        toast({
                          title: "Error",
                          description: "Failed to update setting. Please try again.",
                          variant: "destructive",
                          duration: 3000,
                        });
                      }
                    }}
                  />
                </div>
                
                <div className="mt-6 p-4 bg-card/80 border rounded-md">
                  <p className="text-sm font-medium mb-2">Preview</p>
                  <div className="flex flex-col md:flex-row gap-4 border border-dashed border-muted-foreground/50 p-4 rounded-md">
                    <div className="md:w-1/2">
                      <p className="text-sm text-muted-foreground mb-1">
                        With Series Dropdown {settings.showSeriesDropdown ? "(Current)" : ""}
                      </p>
                      <div className="space-y-2 border p-3 rounded-md">
                        <Label className="text-xs">Series</Label>
                        <div className="h-9 bg-input rounded-md flex items-center px-3 text-sm">
                          Beginner Series
                        </div>
                        <Label className="text-xs">Draw</Label>
                        <div className="h-9 bg-input rounded-md flex items-center px-3 text-sm">
                          Draw #1
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:w-1/2">
                      <p className="text-sm text-muted-foreground mb-1">
                        Without Series Dropdown {!settings.showSeriesDropdown ? "(Current)" : ""}
                      </p>
                      <div className="space-y-2 border p-3 rounded-md">
                        <Label className="text-xs">Current Draw</Label>
                        <div className="h-9 bg-input rounded-md flex items-center px-3 text-sm font-medium">
                          Draw #1 (04/22/25)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Settings are automatically saved when changed
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}