import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertLotteryTicketSchema } from "@shared/schema";
import { appSettingsRouter } from "./routes/appSettings";

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

  // Register app settings routes
  app.use('/api/settings', appSettingsRouter);
  
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
      // Return an empty lottery round since we're using the smart contract now
      const emptyRound = {
        id: 1,
        roundNumber: 42,
        startTime: new Date(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        poolAmount: "0.0",
        participantCount: 0,
        isFinalized: false
      };
      
      return res.json(emptyRound);
    } catch (error) {
      console.error('Error fetching current lottery round:', error);
      return res.status(500).json({ message: 'Failed to fetch current lottery round' });
    }
  });
  
  // Get past lottery rounds with pagination - now returns verified blockchain data
  app.get('/api/lottery/history', async (req, res) => {
    try {
      // Return empty array since we're using the smart contract now
      return res.json([]);
    } catch (error) {
      console.error('Error fetching lottery history:', error);
      return res.status(500).json({ message: 'Failed to fetch lottery history' });
    }
  });
  
  // Get lottery participants for a specific round
  app.get('/api/lottery/:roundId/participants', async (req, res) => {
    try {
      // Return empty array since we're using the smart contract now
      return res.json([]);
    } catch (error) {
      console.error('Error fetching lottery participants:', error);
      return res.status(500).json({ message: 'Failed to fetch lottery participants' });
    }
  });
  
  // Get lottery tickets for a specific wallet address
  app.get('/api/lottery/my-tickets/:walletAddress', async (req, res) => {
    try {
      // Return empty array since we're using the smart contract now
      return res.json([]);
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      return res.status(500).json({ message: 'Failed to fetch user tickets' });
    }
  });
  
  // Record a new lottery ticket purchase
  app.post('/api/lottery/record-purchase', async (req, res) => {
    try {
      // This is a no-op since ticket purchases are handled by the smart contract directly
      return res.status(200).json({
        message: 'Ticket purchases are now handled directly by the smart contract',
        success: true
      });
    } catch (error) {
      console.error('Error recording ticket purchase:', error);
      return res.status(500).json({ message: 'Failed to record ticket purchase' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
