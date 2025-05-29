import React from 'react';
import { Link } from 'wouter';
import { Twitter, Github, ExternalLink } from 'lucide-react';
import { FaDiscord, FaTelegram } from 'react-icons/fa';
import { DEFAULT_NETWORK, CHAIN_IDS, getLotteryAddress } from '@/config/networks';

export default function Footer() {
  // Determine the correct Etherscan URL based on the network
  const getEtherscanUrl = () => {
    const contractAddress = getLotteryAddress();
    switch (DEFAULT_NETWORK.chainId) {
      case Number(CHAIN_IDS.MAINNET):
        return `https://etherscan.io/address/${contractAddress}`;
      case Number(CHAIN_IDS.SEPOLIA):
        return `https://sepolia.etherscan.io/address/${contractAddress}`;
      case Number(CHAIN_IDS.GOERLI):
        return `https://goerli.etherscan.io/address/${contractAddress}`;
      case Number(CHAIN_IDS.BSC_TESTNET):
        return `https://testnet.bscscan.com/address/${contractAddress}`;
      case Number(CHAIN_IDS.BSC_MAINNET):
        return `https://bscscan.com/address/${contractAddress}`;
      default:
        return `https://testnet.bscscan.com/address/${contractAddress}`;
    }
  };

  // Get the network name to display
  const getNetworkName = () => {
    return DEFAULT_NETWORK.name;
  };
  
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-8 md:px-12 lg:px-16 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-6">
              <img 
                src="/images/lottologo.jpeg" 
                alt="Company Logo" 
                className="h-12 w-12 mr-3" 
              />
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-yellow-500 to-amber-500 text-transparent bg-clip-text">
                  CryptoLotto
                </h2>
                <div className="text-xs text-primary/80 font-mono -mt-1">BLOCKCHAIN LOTTERY</div>
              </div>
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
                <Link href="/contact" className="text-gray-400 hover:text-white transition">
                  Contact Us
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
                {getLotteryAddress()}
              </div>
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
