import React, { useState } from 'react';
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

export default function Admin() {
  // Initialize toast
  const { toast } = useToast();
  const { settings, updateShowSeriesDropdown } = useAppSettings();
  
  // Basic state management
  const [activeTab, setActiveTab] = useState('series');
  const [isAdmin, setIsAdmin] = useState(true); // Mock admin status
  const [isLoading, setIsLoading] = useState(false);
  
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
  
  // Mock handlers for form submissions
  const handleStartTimeDraw = () => {
    toast({
      title: "Draw Started",
      description: "Time-based draw has been started successfully",
      variant: "success",
      duration: 3000,
    });
  };
  
  const handleStartBlockDraw = () => {
    toast({
      title: "Draw Started",
      description: "Block-based draw has been started successfully",
      variant: "success",
      duration: 3000,
    });
  };
  
  const handleCompleteDraw = () => {
    toast({
      title: "Draw Completed",
      description: "Draw has been completed successfully",
      variant: "success",
      duration: 3000,
    });
  };
  
  const handleCompleteDrawWithHash = () => {
    toast({
      title: "Draw Completed",
      description: "Draw has been completed with block hash successfully",
      variant: "success",
      duration: 3000,
    });
  };
  
  const handleCreateNewSeries = () => {
    toast({
      title: "Series Created",
      description: "New series has been created successfully",
      variant: "success",
      duration: 3000,
    });
  };
  
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
            You do not have permission to access this page.
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
                  <Label htmlFor="minBlockGap">Minimum Block Gap</Label>
                  <Input 
                    id="minBlockGap" 
                    type="number"
                    min="1"
                    placeholder="Enter minimum blocks between draws"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="maxBlockGap">Maximum Block Gap</Label>
                  <Input 
                    id="maxBlockGap" 
                    type="number"
                    min="1"
                    placeholder="Enter maximum blocks between draws"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => {
                  toast({
                    title: "Settings Updated",
                    description: "Block gap settings have been updated successfully",
                    duration: 3000,
                  });
                }}
              >
                Update Block Gap Settings
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
                    <Input 
                      id="futureBlock" 
                      type="number" 
                      step="1"
                      min="1"
                      value={futureBlock} 
                      onChange={(e) => setFutureBlock(parseInt(e.target.value))}
                    />
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