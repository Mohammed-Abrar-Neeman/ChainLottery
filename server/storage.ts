import { 
  users, type User, type InsertUser,
  lotteryRounds, type LotteryRound, type InsertLotteryRound,
  lotteryTickets, type LotteryTicket, type InsertLotteryTicket 
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Lottery Round operations
  getLotteryRound(id: number): Promise<LotteryRound | undefined>;
  getCurrentLotteryRound(): Promise<LotteryRound | undefined>;
  getLotteryRoundByNumber(roundNumber: number): Promise<LotteryRound | undefined>;
  createLotteryRound(round: InsertLotteryRound): Promise<LotteryRound>;
  updateLotteryRound(id: number, round: Partial<LotteryRound>): Promise<LotteryRound | undefined>;
  getPastLotteryRounds(limit: number, offset: number): Promise<LotteryRound[]>;
  
  // Lottery Ticket operations
  createLotteryTicket(ticket: InsertLotteryTicket): Promise<LotteryTicket>;
  getLotteryTicketsByRound(roundId: number): Promise<LotteryTicket[]>;
  getLotteryTicketsByWalletAddress(walletAddress: string): Promise<LotteryTicket[]>;
  getParticipantCountByRound(roundId: number): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private lotteryRounds: Map<number, LotteryRound>;
  private lotteryTickets: Map<number, LotteryTicket>;
  private userIdCounter: number;
  private roundIdCounter: number;
  private ticketIdCounter: number;

  constructor() {
    this.users = new Map();
    this.lotteryRounds = new Map();
    this.lotteryTickets = new Map();
    this.userIdCounter = 1;
    this.roundIdCounter = 1;
    this.ticketIdCounter = 1;
    
    // Initialize with a current lottery round
    const now = new Date();
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 24);
    
    this.createLotteryRound({
      roundNumber: 42,
      startTime: now,
      endTime: endTime,
      poolAmount: "3.457",
      participantCount: 157,
      isFinalized: false
    });
    
    // Add some past rounds
    const pastEndTime1 = new Date();
    pastEndTime1.setDate(pastEndTime1.getDate() - 1);
    const pastStartTime1 = new Date(pastEndTime1);
    pastStartTime1.setHours(pastStartTime1.getHours() - 24);
    
    this.createLotteryRound({
      roundNumber: 41,
      startTime: pastStartTime1,
      endTime: pastEndTime1,
      poolAmount: "2.84",
      winnerAddress: "0x8F3A547D887D",
      prizeAmount: "1.988",
      participantCount: 142,
      isFinalized: true,
      transactionHash: "0x7ae7b3b42f"
    });
    
    const pastEndTime2 = new Date();
    pastEndTime2.setDate(pastEndTime2.getDate() - 2);
    const pastStartTime2 = new Date(pastEndTime2);
    pastStartTime2.setHours(pastStartTime2.getHours() - 24);
    
    this.createLotteryRound({
      roundNumber: 40,
      startTime: pastStartTime2,
      endTime: pastEndTime2,
      poolAmount: "3.12",
      winnerAddress: "0x3A2B7C8D554E",
      prizeAmount: "2.184",
      participantCount: 163,
      isFinalized: true,
      transactionHash: "0x8bd9c5e2f1"
    });
    
    const pastEndTime3 = new Date();
    pastEndTime3.setDate(pastEndTime3.getDate() - 3);
    const pastStartTime3 = new Date(pastEndTime3);
    pastStartTime3.setHours(pastStartTime3.getHours() - 24);
    
    this.createLotteryRound({
      roundNumber: 39,
      startTime: pastStartTime3,
      endTime: pastEndTime3,
      poolAmount: "2.96",
      winnerAddress: "0x5C4E7F8D664C",
      prizeAmount: "2.072",
      participantCount: 151,
      isFinalized: true,
      transactionHash: "0x9fe8d2c1a0"
    });
    
    // Add some sample participants to current round
    const participantData = [
      { address: "0x71C7656E976F", tickets: 5, txHash: "0xabc123" },
      { address: "0x3A54F4F3312E", tickets: 10, txHash: "0xdef456" },
      { address: "0x8B4ABD7F776A", tickets: 2, txHash: "0xghi789" },
      { address: "0x5C4E7F8D664C", tickets: 3, txHash: "0xjkl012" },
      { address: "0x2A1B3C4D887D", tickets: 15, txHash: "0xmno345" }
    ];
    
    participantData.forEach((participant, index) => {
      this.createLotteryTicket({
        roundId: 1, // Current round ID
        walletAddress: participant.address,
        ticketCount: participant.tickets,
        transactionHash: participant.txHash
      });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress === walletAddress
    );
  }

  async createUser(userInsert: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...userInsert, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  // Lottery Round operations
  async getLotteryRound(id: number): Promise<LotteryRound | undefined> {
    return this.lotteryRounds.get(id);
  }

  async getCurrentLotteryRound(): Promise<LotteryRound | undefined> {
    return Array.from(this.lotteryRounds.values()).find(
      round => !round.isFinalized
    );
  }

  async getLotteryRoundByNumber(roundNumber: number): Promise<LotteryRound | undefined> {
    return Array.from(this.lotteryRounds.values()).find(
      round => round.roundNumber === roundNumber
    );
  }

  async createLotteryRound(roundInsert: InsertLotteryRound): Promise<LotteryRound> {
    const id = this.roundIdCounter++;
    const round: LotteryRound = { ...roundInsert, id };
    this.lotteryRounds.set(id, round);
    return round;
  }

  async updateLotteryRound(id: number, roundUpdate: Partial<LotteryRound>): Promise<LotteryRound | undefined> {
    const round = this.lotteryRounds.get(id);
    if (!round) return undefined;
    
    const updatedRound = { ...round, ...roundUpdate };
    this.lotteryRounds.set(id, updatedRound);
    return updatedRound;
  }

  async getPastLotteryRounds(limit: number, offset: number): Promise<LotteryRound[]> {
    return Array.from(this.lotteryRounds.values())
      .filter(round => round.isFinalized)
      .sort((a, b) => b.roundNumber - a.roundNumber)
      .slice(offset, offset + limit);
  }

  // Lottery Ticket operations
  async createLotteryTicket(ticketInsert: InsertLotteryTicket): Promise<LotteryTicket> {
    const id = this.ticketIdCounter++;
    const ticket: LotteryTicket = { ...ticketInsert, id, purchaseTime: new Date() };
    this.lotteryTickets.set(id, ticket);
    
    // Update participant count for the round
    const round = await this.getLotteryRound(ticketInsert.roundId);
    if (round) {
      await this.updateLotteryRound(round.id, {
        participantCount: round.participantCount + 1
      });
    }
    
    return ticket;
  }

  async getLotteryTicketsByRound(roundId: number): Promise<LotteryTicket[]> {
    return Array.from(this.lotteryTickets.values())
      .filter(ticket => ticket.roundId === roundId)
      .sort((a, b) => b.purchaseTime.getTime() - a.purchaseTime.getTime());
  }

  async getLotteryTicketsByWalletAddress(walletAddress: string): Promise<LotteryTicket[]> {
    return Array.from(this.lotteryTickets.values())
      .filter(ticket => ticket.walletAddress === walletAddress)
      .sort((a, b) => b.purchaseTime.getTime() - a.purchaseTime.getTime());
  }
  
  async getParticipantCountByRound(roundId: number): Promise<number> {
    const tickets = await this.getLotteryTicketsByRound(roundId);
    const uniqueAddresses = new Set(tickets.map(t => t.walletAddress));
    return uniqueAddresses.size;
  }
}

export const storage = new MemStorage();
