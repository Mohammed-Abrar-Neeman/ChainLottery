import React, { useState, useEffect } from 'react';
import { useScalableLotteryData, LotteryDraw } from '@/hooks/useScalableLotteryData';
import { formatAddress } from '@/lib/web3';
import { ExternalLink, History as HistoryIcon, Award, Info as InfoIcon, Target, Filter, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from '@/hooks/useWallet';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ScalableHistory() {
  // Use our scalable lottery data hook
  const {
    seriesList,
    draws,
    participants,
    errors,
    isLoading,
    pagination,
    selectedSeriesIndex,
    selectedDrawId,
    setSelectedSeriesIndex,
    setSelectedDrawId,
    formatEthValue,
    formatUSD,
    fetchAllSeries,
    fetchSeriesDraws,
    fetchDrawData,
    changePage,
    clearError,
    refreshAllData
  } = useScalableLotteryData();
  
  // Filter states
  const [filteredDraws, setFilteredDraws] = useState<LotteryDraw[]>([]);
  const [activeTab, setActiveTab] = useState<string>("draws");
  
  // Format the date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };
  
  // Get series name by index
  const getSeriesName = (seriesIndex: number): string => {
    const series = seriesList.find(s => s.index === seriesIndex);
    return series ? series.name : `Series #${seriesIndex}`;
  };
  
  // Update filtered draws when selection changes
  useEffect(() => {
    // If selected series exists
    if (selectedSeriesIndex !== undefined) {
      // Get draws for the selected series
      const seriesDraws = draws[`${selectedSeriesIndex}`] || [];
      
      if (selectedDrawId !== undefined) {
        // Filter by both series and draw
        const filtered = seriesDraws.filter(draw => draw.drawId === selectedDrawId);
        setFilteredDraws(filtered);
      } else {
        // Filter by series only
        setFilteredDraws(seriesDraws);
      }
    } else {
      // No filters, show all draws from all series
      const allDraws: LotteryDraw[] = [];
      
      // Merge draws from all series
      Object.values(draws).forEach(seriesDraws => {
        allDraws.push(...seriesDraws);
      });
      
      setFilteredDraws(allDraws);
    }
  }, [selectedSeriesIndex, selectedDrawId, draws]);
  
  // Handler for series selection
  const handleSeriesChange = (value: string) => {
    if (value === 'all') {
      console.log('Selected All Series');
      setSelectedSeriesIndex(undefined);
      // Reset draw selection when choosing "All Series"
      setSelectedDrawId(undefined);
    } else {
      const seriesIndex = parseInt(value);
      if (!isNaN(seriesIndex)) {
        console.log(`Selected Series #${seriesIndex}`);
        setSelectedSeriesIndex(seriesIndex);
        // Reset draw selection when series changes
        setSelectedDrawId(undefined);
        
        // Fetch draws for this series if not already loaded
        fetchSeriesDraws(seriesIndex);
      }
    }
  };
  
  // Handler for draw selection
  const handleDrawChange = (value: string) => {
    if (value === 'all') {
      console.log('Selected All Draws');
      setSelectedDrawId(undefined);
    } else {
      const drawId = parseInt(value);
      if (!isNaN(drawId)) {
        console.log(`Selected Draw #${drawId}`);
        setSelectedDrawId(drawId);
        
        // Fetch draw data if not already loaded
        if (selectedSeriesIndex !== undefined) {
          fetchDrawData(selectedSeriesIndex, drawId);
        }
      }
    }
  };
  
  // Get the available draw IDs for the selected series
  const getAvailableDrawIds = (): number[] => {
    if (selectedSeriesIndex === undefined) return [];
    
    // Get the series info from seriesList
    const series = seriesList.find(s => s.index === selectedSeriesIndex);
    return series?.drawIds || [];
  };
  
  // Handle pagination change for draws
  const handleDrawsPageChange = (newPage: number) => {
    if (selectedSeriesIndex !== undefined) {
      changePage(`series_draws_${selectedSeriesIndex}`, newPage);
    }
  };
  
  // Render pagination controls for draws
  const renderDrawsPagination = () => {
    const paginationKey = selectedSeriesIndex !== undefined 
      ? `series_draws_${selectedSeriesIndex}` 
      : '';
    
    if (!paginationKey || !pagination[paginationKey]) return null;
    
    const { page, totalPages } = pagination[paginationKey];
    
    // Only show pagination if we have more than one page
    if (totalPages <= 1) return null;
    
    return (
      <Pagination className="mb-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => handleDrawsPageChange(page - 1)}
              className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
          
          {/* Display page numbers */}
          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
            // Show current page and its neighbors
            const pageToShow = page <= 2 ? i + 1 : page - 1 + i;
            
            if (pageToShow <= totalPages) {
              return (
                <PaginationItem key={i}>
                  <PaginationLink 
                    onClick={() => handleDrawsPageChange(pageToShow)}
                    isActive={page === pageToShow}
                  >
                    {pageToShow}
                  </PaginationLink>
                </PaginationItem>
              );
            }
            return null;
          })}
          
          {/* Show ellipsis if needed */}
          {totalPages > 3 && page < totalPages - 1 && (
            <PaginationItem>
              <span className="px-2">...</span>
            </PaginationItem>
          )}
          
          {/* Show last page if not already shown */}
          {totalPages > 3 && page < totalPages - 1 && (
            <PaginationItem>
              <PaginationLink 
                onClick={() => handleDrawsPageChange(totalPages)}
                isActive={page === totalPages}
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          )}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => handleDrawsPageChange(page + 1)}
              className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };
  
  // Loading state when fetching series or draws
  const isLoadingData = isLoading['series'] || 
                        (selectedSeriesIndex !== undefined && isLoading[`series_draws_${selectedSeriesIndex}`]);
  
  // Errors for series or draws
  const hasSeriesError = errors['series'] !== undefined;
  const hasDrawsError = selectedSeriesIndex !== undefined && 
                        errors[`series_draws_${selectedSeriesIndex}`] !== undefined;
  
  return (
    <div className="container p-4 max-w-7xl mx-auto">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <HistoryIcon className="inline-block mr-2 h-8 w-8" />
              Lottery History
            </h1>
            <p className="text-muted-foreground mt-1">
              View past draws, winners, and prizes across all series.
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={refreshAllData}
            disabled={isLoadingData}
          >
            {isLoadingData ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
        
        {/* Filter controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Results
            </CardTitle>
            <CardDescription>
              Select a series and draw to view specific results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Series filter */}
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-medium mb-2">Series</label>
                <Select 
                  value={selectedSeriesIndex !== undefined ? `${selectedSeriesIndex}` : 'all'}
                  onValueChange={handleSeriesChange}
                  disabled={isLoadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Series" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Series</SelectItem>
                    {seriesList.map(series => (
                      <SelectItem key={series.index} value={`${series.index}`}>
                        {series.name || `Series #${series.index}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Draw filter */}
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-medium mb-2">Draw</label>
                <Select 
                  value={selectedDrawId !== undefined ? `${selectedDrawId}` : 'all'}
                  onValueChange={handleDrawChange}
                  disabled={selectedSeriesIndex === undefined || isLoadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Draws" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Draws</SelectItem>
                    {getAvailableDrawIds().map(drawId => (
                      <SelectItem key={drawId} value={`${drawId}`}>
                        Draw #{drawId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedSeriesIndex(undefined);
                setSelectedDrawId(undefined);
              }}
              disabled={selectedSeriesIndex === undefined && selectedDrawId === undefined}
            >
              Clear Filters
            </Button>
          </CardFooter>
        </Card>
        
        {/* Display errors if any */}
        {(hasSeriesError || hasDrawsError) && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription>
              {hasSeriesError && errors['series']?.message}
              {hasDrawsError && errors[`series_draws_${selectedSeriesIndex}`]?.message}
              
              {/* Retry button */}
              {(errors['series']?.retry || (hasDrawsError && errors[`series_draws_${selectedSeriesIndex}`]?.retry)) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    if (hasSeriesError && errors['series']?.retry) {
                      errors['series'].retry?.();
                    } else if (hasDrawsError && errors[`series_draws_${selectedSeriesIndex}`]?.retry) {
                      errors[`series_draws_${selectedSeriesIndex}`].retry?.();
                    }
                  }}
                >
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Main content tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="draws">Draws</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
          </TabsList>
          
          {/* Draws Tab */}
          <TabsContent value="draws">
            {/* Pagination for draws */}
            {renderDrawsPagination()}
            
            {/* Loading state */}
            {isLoadingData && (
              <div className="space-y-4 mb-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
            )}
            
            {/* No data state */}
            {!isLoadingData && filteredDraws.length === 0 && (
              <div className="text-center p-8 border rounded-lg">
                <InfoIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h3 className="text-lg font-medium">No Draw Data Available</h3>
                <p className="text-muted-foreground mt-1">
                  {selectedSeriesIndex !== undefined
                    ? `No draws found for ${getSeriesName(selectedSeriesIndex)}`
                    : 'No lottery draws found'}
                </p>
              </div>
            )}
            
            {/* Draws table */}
            {!isLoadingData && filteredDraws.length > 0 && (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="h-12 px-4 text-left align-middle font-medium whitespace-nowrap">
                          Series
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium whitespace-nowrap">
                          Draw
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium whitespace-nowrap">
                          Draw Date
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium whitespace-nowrap">
                          Ticket Price
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium whitespace-nowrap">
                          Pool Size
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium whitespace-nowrap">
                          Status
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium whitespace-nowrap">
                          Winner
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium whitespace-nowrap">
                          Winning Numbers
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDraws.map(draw => (
                        <tr key={`${draw.seriesIndex}_${draw.drawId}`} className="border-t hover:bg-muted/50">
                          <td className="p-4 align-middle">
                            <Badge variant="outline">
                              {draw.seriesName || `Series #${draw.seriesIndex}`}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">
                            <span className="font-medium">Draw #{draw.drawId}</span>
                          </td>
                          <td className="p-4 align-middle">
                            {formatDate(draw.endTime)}
                          </td>
                          <td className="p-4 align-middle">
                            {formatEthValue(draw.ticketPrice)} ETH
                            <div className="text-xs text-muted-foreground">
                              {formatUSD(draw.ticketPrice)}
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            {formatEthValue(draw.jackpotAmount)} ETH
                            <div className="text-xs text-muted-foreground">
                              {formatUSD(draw.jackpotAmount)}
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            {draw.isCompleted ? (
                              <Badge className="bg-green-500 text-white">Completed</Badge>
                            ) : (
                              <Badge variant="secondary">In Progress</Badge>
                            )}
                          </td>
                          <td className="p-4 align-middle">
                            {draw.isCompleted && draw.winnerAddress && draw.winnerAddress !== '0x0000000000000000000000000000000000000000' ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    {formatAddress(draw.winnerAddress)}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {draw.winnerAddress}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : draw.isCompleted ? (
                              <span className="text-muted-foreground">No Winner</span>
                            ) : (
                              <span className="text-muted-foreground">Pending</span>
                            )}
                          </td>
                          <td className="p-4 align-middle">
                            {draw.isCompleted && draw.winningNumbers && draw.winningNumbers.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {draw.winningNumbers.slice(0, 5).map((num, index) => (
                                  <span 
                                    key={index} 
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-medium text-xs"
                                  >
                                    {num < 10 ? `0${num}` : num}
                                  </span>
                                ))}
                                {draw.winningNumbers.length > 5 && (
                                  <span 
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 font-medium text-xs"
                                  >
                                    {draw.winningNumbers[5] < 10 ? `0${draw.winningNumbers[5]}` : draw.winningNumbers[5]}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not Available</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Participants Tab */}
          <TabsContent value="participants">
            {/* Participants content will be implemented later */}
            <div className="text-center p-8 border rounded-lg">
              <InfoIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="text-lg font-medium">Select a Draw to View Participants</h3>
              <p className="text-muted-foreground mt-1">
                Use the filters above to select a specific series and draw to view participant details.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}