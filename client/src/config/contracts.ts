import { ethers } from 'ethers';
import LOTTERY_ABI from '@/abi/Lottery.json';

// Contract addresses configuration
export const CONTRACTS = {
  // Get from environment variable or use default
  LOTTERY: process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS || '0x204f5777A911090572633De22b2571d6Bb89308d',
} as const;

// Contract ABIs
export {default as LOTTERY_ABI } from '@/abi/Lottery.json';

// Contract interaction types
export interface LotteryData {
  jackpotAmount: string;
  ticketPrice: string;
  currentDraw: number;
  timeRemaining: number;
  endTimestamp?: number;
  participants: Participant[];
  participantCount: number;
  seriesIndex?: number;
}

export interface Participant {
  walletAddress: string;
  ticketCount: number;
  timestamp: number;
  transactionHash?: string;
  drawId?: number;
  seriesIndex?: number;
  ticketId?: string;
  numbers?: number[];
  lottoNumber?: number | null;
}

export interface LotteryDraw {
  drawId: number;
  seriesIndex: number;
  ticketPrice: string;
  jackpot: string;
  drawBlock: number;
  isFutureBlockDraw: boolean;
  completed: boolean;
  winningNumbers?: number[];
  endTimestamp?: number;
}

export interface LotterySeries {
  index: number;
  active: boolean;
  drawCount: number;
  name: string;
  seriesName?: string;
  description?: string;
}

export interface Winner {
  winnerAddress: string;
  amountWon: string;
  drawId?: number;
  seriesIndex?: number;
  transactionHash?: string;
  timestamp?: number;
  ticketNumbers?: {
    numbers: number[];
    lottoNumber: number | null;
  }[];
  winningNumbers?: number[];
} 