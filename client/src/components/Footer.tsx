import React from 'react';
import { Link } from 'wouter';
import { Twitter, Github, ExternalLink } from 'lucide-react';
import { FaDiscord, FaTelegram } from 'react-icons/fa';
import { ACTIVE_LOTTERY_CONTRACT_ADDRESS, ACTIVE_CHAIN_ID, CHAIN_IDS } from '@shared/contracts';

export default function Footer() {
  // Determine the correct Etherscan URL based on the network
  const getEtherscanUrl = () => {
    switch (ACTIVE_CHAIN_ID) {
      case CHAIN_IDS.MAINNET:
        return `https://etherscan.io/address/${ACTIVE_LOTTERY_CONTRACT_ADDRESS}`;
      case CHAIN_IDS.SEPOLIA:
        return `https://sepolia.etherscan.io/address/${ACTIVE_LOTTERY_CONTRACT_ADDRESS}`;
      case CHAIN_IDS.GOERLI:
        return `https://goerli.etherscan.io/address/${ACTIVE_LOTTERY_CONTRACT_ADDRESS}`;
      default:
        return `https://sepolia.etherscan.io/address/${ACTIVE_LOTTERY_CONTRACT_ADDRESS}`;
    }
  };

  // Get the network name to display
  const getNetworkName = () => {
    switch (ACTIVE_CHAIN_ID) {
      case CHAIN_IDS.MAINNET:
        return 'Ethereum Mainnet';
      case CHAIN_IDS.SEPOLIA:
        return 'Sepolia Testnet';
      case CHAIN_IDS.GOERLI:
        return 'Goerli Testnet';
      default:
        return 'Testnet';
    }
  };
  
  return (
    <footer className="bg-secondary text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-6">
              <svg 
                className="h-10 w-10 mr-3 rounded-full"
                viewBox="0 0 40 40" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="20" cy="20" r="20" fill="#6C63FF" />
                <path d="M12 20L20 12L28 20L20 28L12 20Z" fill="white" />
                <path d="M16 20L20 16L24 20L20 24L16 20Z" fill="#2D3748" />
              </svg>
              <h2 className="text-2xl font-bold">CryptoLotto</h2>
            </div>
            <p className="text-gray-400 mb-6">
              The fairest, most transparent blockchain lottery powered by smart contracts and verifiable randomness.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <FaDiscord className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <FaTelegram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/tickets" className="text-gray-400 hover:text-white transition">
                  My Tickets
                </Link>
              </li>
              <li>
                <Link href="/history" className="text-gray-400 hover:text-white transition">
                  Past Winners
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Smart Contract</h3>
            <div className="glass-dark rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Contract Address ({getNetworkName()}):</span>
                <a 
                  href={getEtherscanUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-white transition"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <div className="font-mono text-sm break-all">
                {ACTIVE_LOTTERY_CONTRACT_ADDRESS}
              </div>
            </div>
            <div className="flex space-x-2">
              <a 
                href="#" 
                className="bg-primary bg-opacity-20 hover:bg-opacity-30 text-white font-medium rounded px-4 py-2 text-sm transition flex items-center"
              >
                <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="currentColor"/>
                  <path d="M14 17H7V15H14V17ZM17 13H7V11H17V13ZM17 9H7V7H17V9Z" fill="currentColor"/>
                </svg>
                Read Docs
              </a>
              <a 
                href="https://github.com/chandan-vaishali/lotto-dapp" 
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary bg-opacity-20 hover:bg-opacity-30 text-white font-medium rounded px-4 py-2 text-sm transition flex items-center"
              >
                <Github className="h-4 w-4 mr-1" />
                Source Code
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} CryptoLotto. All rights reserved.</p>
          <p className="mt-2">
            CryptoLotto is not a gambling service. It's a decentralized lottery running on the Ethereum blockchain with verifiable randomness.
          </p>
        </div>
      </div>
    </footer>
  );
}
