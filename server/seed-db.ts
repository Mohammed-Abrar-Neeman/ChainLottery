import { db } from "./db";
import { lotteryRounds, lotteryTickets } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Check if lottery rounds already exist
  const existingRounds = await db.select().from(lotteryRounds);
  if (existingRounds.length > 0) {
    console.log("Database already seeded. Found existing lottery rounds.");
    return;
  }

  // Initialize with a current lottery round
  const now = new Date();
  const endTime = new Date();
  endTime.setHours(endTime.getHours() + 24);
  
  console.log("Adding current lottery round...");
  const [currentRound] = await db
    .insert(lotteryRounds)
    .values({
      roundNumber: 42,
      startTime: now,
      endTime: endTime,
      poolAmount: "3.457",
      participantCount: 157,
      isFinalized: false
    })
    .returning();
  
  // Add some past rounds
  console.log("Adding past lottery rounds...");
  
  const pastEndTime1 = new Date();
  pastEndTime1.setDate(pastEndTime1.getDate() - 1);
  const pastStartTime1 = new Date(pastEndTime1);
  pastStartTime1.setHours(pastStartTime1.getHours() - 24);
  
  await db
    .insert(lotteryRounds)
    .values({
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
  
  await db
    .insert(lotteryRounds)
    .values({
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
  
  await db
    .insert(lotteryRounds)
    .values({
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
  console.log("Adding sample participants...");
  const participantData = [
    { address: "0x71C7656E976F", tickets: 5, txHash: "0xabc123" },
    { address: "0x3A54F4F3312E", tickets: 10, txHash: "0xdef456" },
    { address: "0x8B4ABD7F776A", tickets: 2, txHash: "0xghi789" },
    { address: "0x5C4E7F8D664C", tickets: 3, txHash: "0xjkl012" },
    { address: "0x2A1B3C4D887D", tickets: 15, txHash: "0xmno345" }
  ];
  
  for (const participant of participantData) {
    await db
      .insert(lotteryTickets)
      .values({
        roundId: currentRound.id,
        walletAddress: participant.address,
        ticketCount: participant.tickets,
        transactionHash: participant.txHash
      });
  }

  console.log("Database seeding completed!");
}

export default seed;