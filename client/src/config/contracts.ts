// Contract addresses configuration
export const CONTRACTS = {
  // Get from environment variable or use default
  LOTTERY: process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS || '0x204f5777A911090572633De22b2571d6Bb89308d',
} as const;

// Contract ABIs
export { default as LOTTERY_ABI } from '@/abi/Lottery.json'; 