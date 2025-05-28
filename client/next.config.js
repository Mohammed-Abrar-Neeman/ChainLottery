/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_PROJECT_ID: process.env.NEXT_PUBLIC_PROJECT_ID,
    NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS,
    NEXT_PUBLIC_BSC_TESTNET_RPC: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC,
  },
}

module.exports = nextConfig 