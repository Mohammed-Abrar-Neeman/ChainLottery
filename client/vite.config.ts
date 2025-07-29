import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    host: true
  },
  preview: {
    allowedHosts: [
      'localhost',
      'lottoblokk.com'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NEXT_PUBLIC_BASE_MAINNET_RPC': JSON.stringify(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC),
    'process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC': JSON.stringify(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC),
  },
}) 