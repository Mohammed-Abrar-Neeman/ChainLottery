import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Lottery Rounds
export const lotteryRounds = pgTable("lottery_rounds", {
  id: serial("id").primaryKey(),
  roundNumber: integer("round_number").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  poolAmount: numeric("pool_amount").notNull(),
  winnerAddress: text("winner_address"),
  prizeAmount: numeric("prize_amount"),
  participantCount: integer("participant_count").notNull().default(0),
  isFinalized: boolean("is_finalized").notNull().default(false),
  transactionHash: text("transaction_hash"),
});

// Lottery Tickets
export const lotteryTickets = pgTable("lottery_tickets", {
  id: serial("id").primaryKey(),
  roundId: integer("round_id").notNull(),
  walletAddress: text("wallet_address").notNull(),
  ticketCount: integer("ticket_count").notNull(),
  purchaseTime: timestamp("purchase_time").defaultNow().notNull(),
  transactionHash: text("transaction_hash").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertLotteryRoundSchema = createInsertSchema(lotteryRounds).omit({
  id: true,
});

export const insertLotteryTicketSchema = createInsertSchema(lotteryTickets).omit({
  id: true,
  purchaseTime: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertLotteryRound = z.infer<typeof insertLotteryRoundSchema>;
export type LotteryRound = typeof lotteryRounds.$inferSelect;

export type InsertLotteryTicket = z.infer<typeof insertLotteryTicketSchema>;
export type LotteryTicket = typeof lotteryTickets.$inferSelect;
