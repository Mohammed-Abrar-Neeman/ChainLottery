import { 
  users, type User, type InsertUser,
  lotteryRounds, type LotteryRound, type InsertLotteryRound,
  lotteryTickets, type LotteryTicket, type InsertLotteryTicket 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getLotteryRound(id: number): Promise<LotteryRound | undefined> {
    const [round] = await db.select().from(lotteryRounds).where(eq(lotteryRounds.id, id));
    return round || undefined;
  }

  async getCurrentLotteryRound(): Promise<LotteryRound | undefined> {
    const [currentRound] = await db.select().from(lotteryRounds).where(eq(lotteryRounds.isFinalized, false));
    return currentRound || undefined;
  }

  async getLotteryRoundByNumber(roundNumber: number): Promise<LotteryRound | undefined> {
    const [round] = await db.select().from(lotteryRounds).where(eq(lotteryRounds.roundNumber, roundNumber));
    return round || undefined;
  }

  async createLotteryRound(round: InsertLotteryRound): Promise<LotteryRound> {
    const [newRound] = await db
      .insert(lotteryRounds)
      .values(round)
      .returning();
    return newRound;
  }

  async updateLotteryRound(id: number, round: Partial<LotteryRound>): Promise<LotteryRound | undefined> {
    const [updatedRound] = await db
      .update(lotteryRounds)
      .set(round)
      .where(eq(lotteryRounds.id, id))
      .returning();
    return updatedRound || undefined;
  }

  async getPastLotteryRounds(limit: number, offset: number): Promise<LotteryRound[]> {
    return await db
      .select()
      .from(lotteryRounds)
      .where(eq(lotteryRounds.isFinalized, true))
      .orderBy(desc(lotteryRounds.roundNumber))
      .limit(limit)
      .offset(offset);
  }

  async createLotteryTicket(ticket: InsertLotteryTicket): Promise<LotteryTicket> {
    const [newTicket] = await db
      .insert(lotteryTickets)
      .values(ticket)
      .returning();
    
    // Update participant count for the round
    await db
      .update(lotteryRounds)
      .set({
        participantCount: sql`${lotteryRounds.participantCount} + 1`
      })
      .where(eq(lotteryRounds.id, ticket.roundId));
    
    return newTicket;
  }

  async getLotteryTicketsByRound(roundId: number): Promise<LotteryTicket[]> {
    return await db
      .select()
      .from(lotteryTickets)
      .where(eq(lotteryTickets.roundId, roundId))
      .orderBy(desc(lotteryTickets.purchaseTime));
  }

  async getLotteryTicketsByWalletAddress(walletAddress: string): Promise<LotteryTicket[]> {
    return await db
      .select()
      .from(lotteryTickets)
      .where(eq(lotteryTickets.walletAddress, walletAddress))
      .orderBy(desc(lotteryTickets.purchaseTime));
  }
  
  async getParticipantCountByRound(roundId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(distinct ${lotteryTickets.walletAddress})` })
      .from(lotteryTickets)
      .where(eq(lotteryTickets.roundId, roundId));
    
    return result[0]?.count || 0;
  }
}

export const storage = new DatabaseStorage();
