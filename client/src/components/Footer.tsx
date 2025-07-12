import React from 'react';
import { Link } from 'wouter';
import { Twitter, Github, ExternalLink } from 'lucide-react';
import { FaDiscord, FaInstagram, FaTelegram, FaYoutube } from 'react-icons/fa';
import { DEFAULT_NETWORK, CHAIN_IDS, getLotteryAddress } from '@/config/networks';
import { useConfigData } from '@/hooks/useConfigData';

export default function Footer() {
  const { data: config, isLoading, error } = useConfigData();
  const footer = config?.footerConfig;

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
        return `https://polygonscan.com/address/${contractAddress}`;
      case Number(CHAIN_IDS.BSC_MAINNET):
        return `https://bscscan.com/address/${contractAddress}`;
      case Number(CHAIN_IDS.POLYGON_MAINNET):
        return `https://polygonscan.com/address/${contractAddress}`;
      default:
        return `https://polygonscan.com/address/${contractAddress}`;
    }
  };

  // Get the network name to display
  const getNetworkName = () => {
    return DEFAULT_NETWORK.name;
  };

  if (isLoading) {
    return <footer className="bg-card border-t border-border text-center py-8 text-gray-400">Loading footer...</footer>;
  }
  if (error || !footer) {
    return <footer className="bg-card border-t border-border text-center py-8 text-red-500">Failed to load footer.</footer>;
  }

  return (
    <footer className="bg-[hsl(220,13%,12%)] border-t border-border">
      <div className="container mx-auto px-8 md:px-12 lg:px-16 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-6">
              <img 
                src={footer.logoUrl} 
                alt={footer.logoAlt || 'Company Logo'} 
                className="h-12 w-12 mr-3" 
              />
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-yellow-500 to-amber-500 text-transparent bg-clip-text">
                  {footer.projectName}
                </h2>
                <div className="text-xs text-primary/80 font-mono -mt-1">{footer.projectTagline}</div>
              </div>
            </div>
            <p className="text-gray-400 mb-6">
              {footer.description}
            </p>
            <div className="flex space-x-4">
              {footer.socialLinks?.map((link: any, i: number) => {
                let icon = null;
                if (link.icon === 'twitter') icon = <Twitter className="h-5 w-5" />;
                if (link.icon === 'discord') icon = <FaDiscord className="h-5 w-5" />;
                if (link.icon === 'telegram') icon = <FaTelegram className="h-5 w-5" />;
                if (link.icon === 'youtube') icon = <FaYoutube className="h-5 w-5" />;
                if (link.icon === 'insta') icon = <FaInstagram className="h-5 w-5" />;
                return (
                  <a key={i} href={link.href} className="text-gray-400 hover:text-white transition" target="_blank" rel="noopener noreferrer">
                    {icon}
                  </a>
                );
              })}
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
          <p>{footer?.copyright?.replace('{year}', String(new Date().getFullYear()))}</p>
          <p className="mt-2">
            {footer.disclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
}
