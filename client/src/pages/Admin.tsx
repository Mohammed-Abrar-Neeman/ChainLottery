
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatEther } from 'ethers';

export default function Admin() {
  const { data: currentRound } = useQuery({
    queryKey: ['currentRound'],
    queryFn: async () => {
      const response = await fetch('/api/lottery/current');
      return response.json();
    }
  });

  const { data: pastRounds } = useQuery({
    queryKey: ['pastRounds'],
    queryFn: async () => {
      const response = await fetch('/api/lottery/history');
      return response.json();
    }
  });

  const handleFinalizeDraw = async (roundId: number) => {
    try {
      // TODO: Implement contract interaction for draw finalization
      console.log('Finalizing round:', roundId);
    } catch (error) {
      console.error('Error finalizing draw:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Current Round Stats</CardTitle>
          </CardHeader>
          <CardContent>
            {currentRound && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Round Number</p>
                  <p className="text-2xl font-bold">{currentRound.roundNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pool Amount</p>
                  <p className="text-2xl font-bold">{formatEther(currentRound.poolAmount)} ETH</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Participants</p>
                  <p className="text-2xl font-bold">{currentRound.participantCount}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Past Rounds</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Round</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Pool Amount</TableHead>
                  <TableHead>Winner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastRounds?.map((round: any) => (
                  <TableRow key={round.id}>
                    <TableCell>{round.roundNumber}</TableCell>
                    <TableCell>{new Date(round.startTime).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(round.endTime).toLocaleDateString()}</TableCell>
                    <TableCell>{formatEther(round.poolAmount)} ETH</TableCell>
                    <TableCell className="truncate max-w-[200px]">
                      {round.winnerAddress || 'Not drawn'}
                    </TableCell>
                    <TableCell>{round.isFinalized ? 'Completed' : 'Pending'}</TableCell>
                    <TableCell>
                      {!round.isFinalized && (
                        <Button 
                          size="sm"
                          onClick={() => handleFinalizeDraw(round.id)}
                        >
                          Finalize Draw
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
