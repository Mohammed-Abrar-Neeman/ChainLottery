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
  
  // Get past lottery rounds with pagination
  app.get('/api/lottery/history', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const pastRounds = await storage.getPastLotteryRounds(limit, offset);
      return res.json(pastRounds);
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
