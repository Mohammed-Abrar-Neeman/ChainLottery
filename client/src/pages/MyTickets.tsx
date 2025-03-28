import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import WalletModal from '@/components/modals/WalletModal';
import { formatAddress } from '@/lib/web3';
import { ExternalLink, Ticket, AlertTriangle, Wallet } from 'lucide-react';
import { useLotteryData } from '@/hooks/useLotteryData';

export default function MyTickets() {
  const { account, isConnected } = useWallet();
  const { formatUSD } = useLotteryData();
  const [showWalletModal, setShowWalletModal] = React.useState(false);
  
  // Fetch user's tickets
  const {
    data: tickets,
    isLoading,
    error
  } = useQuery({
    queryKey: account ? [`/api/lottery/my-tickets/${account}`] : [],
    enabled: !!account,
  });
  
  // Format the date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(new Date(date));
  };
  
  // If not connected, show connect wallet prompt
  if (!isConnected) {
    return (
      <div className="mt-10 flex flex-col items-center text-center">
        <div className="bg-gray-100 rounded-full p-4 mb-4">
          <Wallet className="h-10 w-10 text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
        <p className="text-gray-600 mb-6 max-w-md">
          Connect your wallet to view your lottery tickets and transaction history.
        </p>
        <Button 
          onClick={() => setShowWalletModal(true)}
          className="bg-primary hover:bg-opacity-90 text-white font-semibold rounded-full px-8 py-3 transition"
        >
          Connect Wallet
        </Button>
        <WalletModal open={showWalletModal} onClose={() => setShowWalletModal(false)} />
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="mt-10 text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your tickets...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="mt-10 flex flex-col items-center text-center">
        <div className="bg-red-100 rounded-full p-4 mb-4">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Error Loading Tickets</h1>
        <p className="text-gray-600 mb-6 max-w-md">
          We couldn't load your tickets. Please try again later.
        </p>
        <Button 
          onClick={() => window.location.reload()}
          className="bg-primary hover:bg-opacity-90 text-white font-semibold rounded-full px-8 py-3 transition"
        >
          Refresh
        </Button>
      </div>
    );
  }
  
  // No tickets state
  if (!tickets || tickets.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center text-center">
        <div className="bg-gray-100 rounded-full p-4 mb-4">
          <Ticket className="h-10 w-10 text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">No Tickets Found</h1>
        <p className="text-gray-600 mb-6 max-w-md">
          You haven't purchased any lottery tickets yet. Buy tickets to participate in the current lottery round.
        </p>
        <Button 
          onClick={() => window.location.href = '/#buy-tickets'}
          className="bg-primary hover:bg-opacity-90 text-white font-semibold rounded-full px-8 py-3 transition"
        >
          Buy Tickets
        </Button>
      </div>
    );
  }
  
  // Mock tickets for development
  const mockTickets = [
    {
      id: 1,
      roundId: 1,
      roundNumber: 42,
      walletAddress: account || '0x71C7656E976F',
      ticketCount: 5,
      purchaseTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      transactionHash: '0xabc123',
      roundStatus: 'Active',
      isWinner: false
    },
    {
      id: 2,
      roundId: 2,
      roundNumber: 41,
      walletAddress: account || '0x71C7656E976F',
      ticketCount: 3,
      purchaseTime: new Date(Date.now() - 26 * 60 * 60 * 1000),
      transactionHash: '0xdef456',
      roundStatus: 'Completed',
      isWinner: false
    },
    {
      id: 3,
      roundId: 3,
      roundNumber: 40,
      walletAddress: account || '0x71C7656E976F',
      ticketCount: 10,
      purchaseTime: new Date(Date.now() - 50 * 60 * 60 * 1000),
      transactionHash: '0xghi789',
      roundStatus: 'Completed',
      isWinner: true
    }
  ];
  
  const displayTickets = tickets || mockTickets;
  
  return (
    <div className="mt-8">
      <h1 className="text-2xl font-bold mb-6">My Lottery Tickets</h1>
      
      <div className="glass rounded-2xl shadow-glass p-6 mb-8">
        <div className="flex items-center mb-4">
          <div className="h-10 w-10 rounded-full bg-primary bg-opacity-20 flex items-center justify-center text-primary mr-3">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Connected Wallet</h2>
            <p className="font-mono text-sm text-gray-600">{account ? formatAddress(account) : ''}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Total Tickets</div>
            <div className="text-2xl font-bold font-mono">
              {displayTickets.reduce((total, ticket) => total + ticket.ticketCount, 0)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Active Tickets</div>
            <div className="text-2xl font-bold font-mono">
              {displayTickets.filter(ticket => ticket.roundStatus === 'Active').reduce((total, ticket) => total + ticket.ticketCount, 0)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Winning Tickets</div>
            <div className="text-2xl font-bold font-mono">
              {displayTickets.filter(ticket => ticket.isWinner).reduce((total, ticket) => total + ticket.ticketCount, 0)}
            </div>
          </div>
        </div>
      </div>
      
      <h2 className="text-xl font-bold mb-4">Ticket History</h2>
      
      <div className="glass rounded-2xl shadow-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100 bg-opacity-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TX</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm">#{ticket.roundNumber}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(ticket.purchaseTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                    {ticket.ticketCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                    {(0.01 * ticket.ticketCount).toFixed(2)} ETH
                    <div className="text-xs text-gray-500">
                      ≈ {formatUSD((0.01 * ticket.ticketCount).toString())}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ticket.isWinner ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Winner 🏆
                      </span>
                    ) : ticket.roundStatus === 'Active' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Completed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <a 
                      href={`https://etherscan.io/tx/${ticket.transactionHash}`}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-gray-400 hover:text-primary transition"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
