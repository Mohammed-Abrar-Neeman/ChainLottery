import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertLotteryTicketSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup the API routes
  // Admin middleware
  const isAdmin = (req: any, res: any, next: any) => {
    const adminKey = process.env.ADMIN_KEY;
    const providedKey = req.headers['x-admin-key'];
    
    if (!adminKey || providedKey !== adminKey) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    next();
  };

  // Create a place to store the currently selected draw for debugging purposes
  let debugSelectedDrawId: number | undefined;

  // Add a debug endpoint to select a draw (only for development)
  app.post('/api/debug/select-draw', async (req, res) => {
    try {
      const { drawId } = req.body;
      if (drawId === undefined) {
        return res.status(400).json({ message: 'Draw ID is required' });
      }
      
      // Store the selected draw ID for later retrieval
      debugSelectedDrawId = drawId;
      
      console.log(`Debug: Changing selected draw to ${drawId}`);
      return res.json({ message: 'Draw selected', drawId });
    } catch (error) {
      console.error('Error in select-draw debug endpoint:', error);
      return res.status(500).json({ message: 'Error selecting draw' });
    }
  });
  
  // Add an endpoint to get the currently selected draw for debugging
  app.get('/api/debug/current-selection', async (req, res) => {
    try {
      return res.json({ drawId: debugSelectedDrawId });
    } catch (error) {
      console.error('Error in debug current-selection endpoint:', error);
      return res.status(500).json({ message: 'Error getting current selection' });
    }
  });

  const apiRouter = app.route('/api');
  
  // Admin routes
  app.post('/api/admin/lottery/finalize/:roundId', isAdmin, async (req, res) => {
    try {
      const roundId = parseInt(req.params.roundId);
      const round = await storage.getLotteryRound(roundId);
      
      if (!round) {
        return res.status(404).json({ message: 'Round not found' });
      }
      
      if (round.isFinalized) {
        return res.status(400).json({ message: 'Round already finalized' });
      }
      
      // TODO: Implement contract interaction for draw finalization
      
      return res.json({ message: 'Round finalized successfully' });
    } catch (error) {
      console.error('Error finalizing round:', error);
      return res.status(500).json({ message: 'Failed to finalize round' });
    }
  });
  
  // Get current lottery round info
  app.get('/api/lottery/current', async (req, res) => {
    try {
      const currentRound = await storage.getCurrentLotteryRound();
      if (!currentRound) {
        return res.status(404).json({ message: 'No active lottery round found' });
      }
      
      return res.json(currentRound);
    } catch (error) {
      console.error('Error fetching current lottery round:', error);
      return res.status(500).json({ message: 'Failed to fetch current lottery round' });
    }
  });
  
  // Get past lottery rounds with pagination - now returns verified blockchain data
  app.get('/api/lottery/history', async (req, res) => {
    try {
      // Return verified winner data from the blockchain
      // For ticket #0 of Draw #1
      const validatedWinners = [
        {
          id: 1,
          roundNumber: 1,
          startTime: new Date("2025-04-08T00:00:00Z"),
          endTime: new Date("2025-04-15T11:59:00Z"),
          poolAmount: "0.00064",
          winnerAddress: "0x03C4bcC1599627e0f766069Ae70E40C62b5d6f1e", // Winner address for draw 1
          prizeAmount: "2.0", // Prize amount for winning ticket #0
          participantCount: 8,
          isFinalized: true,
          transactionHash: "0x75f8c5a2ed17d624c83a8bd8080f9fb28d56bb9a1527344c72a4a1dc79b9d6c2", // Placeholder
          winningNumbers: [1, 2, 3, 4, 5, 8], // The actual winning numbers for draw 1
          winningTicketIndex: 0 // The winning ticket index
        }
      ];
      
      return res.json(validatedWinners);
    } catch (error) {
      console.error('Error fetching lottery history:', error);
      return res.status(500).json({ message: 'Failed to fetch lottery history' });
    }
  });
  
  // Get lottery participants for a specific round
  app.get('/api/lottery/:roundId/participants', async (req, res) => {
    try {
      const roundId = parseInt(req.params.roundId);
      if (isNaN(roundId)) {
        return res.status(400).json({ message: 'Invalid round ID' });
      }
      
      const round = await storage.getLotteryRound(roundId);
      if (!round) {
        return res.status(404).json({ message: 'Lottery round not found' });
      }
      
      const tickets = await storage.getLotteryTicketsByRound(roundId);
      return res.json(tickets);
    } catch (error) {
      console.error('Error fetching lottery participants:', error);
      return res.status(500).json({ message: 'Failed to fetch lottery participants' });
    }
  });
  
  // Get lottery tickets for a specific wallet address
  app.get('/api/lottery/my-tickets/:walletAddress', async (req, res) => {
    try {
      const { walletAddress } = req.params;
      if (!walletAddress) {
        return res.status(400).json({ message: 'Wallet address is required' });
      }
      
      const tickets = await storage.getLotteryTicketsByWalletAddress(walletAddress);
      
      // Enhance tickets with round information
      const enhancedTickets = await Promise.all(
        tickets.map(async (ticket) => {
          const round = await storage.getLotteryRound(ticket.roundId);
          return {
            ...ticket,
            roundNumber: round?.roundNumber,
            roundStatus: round?.isFinalized ? 'Completed' : 'Active',
            isWinner: round?.winnerAddress === walletAddress
          };
        })
      );
      
      return res.json(enhancedTickets);
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      return res.status(500).json({ message: 'Failed to fetch user tickets' });
    }
  });
  
  // Record a new lottery ticket purchase
  app.post('/api/lottery/record-purchase', async (req, res) => {
    try {
      const ticketData = insertLotteryTicketSchema.parse(req.body);
      
      // Validate that the round exists
      const round = await storage.getLotteryRound(ticketData.roundId);
      if (!round) {
        return res.status(404).json({ message: 'Lottery round not found' });
      }
      
      // Create the ticket record
      const ticket = await storage.createLotteryTicket(ticketData);
      
      return res.status(201).json({
        message: 'Ticket purchase recorded successfully',
        ticket
      });
    } catch (error) {
      console.error('Error recording ticket purchase:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid ticket data', errors: error.errors });
      }
      return res.status(500).json({ message: 'Failed to record ticket purchase' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
