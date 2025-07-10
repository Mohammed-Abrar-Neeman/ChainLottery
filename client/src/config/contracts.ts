// Contract addresses configuration
console.log('Loading contract address from env:', process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS);

export const CONTRACTS = {
  // Polygon Mainnet Lottery Contract - must be set in .env.local
  LOTTERY: process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS || '0x05E865DE0375463d447caeEd6DF713b6F282A41d',
} as const;

// Contract ABIs
export {default as LOTTERY_ABI } from '@/abi/Lottery.json';

// Contract interaction types
export interface LotteryData {
  jackpotAmount: string;
  ticketPrice: string;
  currentDraw: number;
  timeRemaining: number;
  endTimestamp: number;
  winningTicketNumbers: number[];
  participantCount: number;
  seriesIndex?: number;
  completed: boolean;
  winnerAddress?: string;
  transactionHash?: string;
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
  drawCount: number;
  name: string;
  seriesName?: string;
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