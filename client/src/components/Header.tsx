import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useWallet } from '@/hooks/useWallet';
import { useAdmin } from '@/hooks/useAdmin';
import { formatAddress } from '@/lib/web3';
import { getLotteryContract } from '@/lib/lotteryContract';
import { useToast } from '@/hooks/use-toast';
import WalletModal from './modals/WalletModal';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Wallet, Menu, X, ShieldCheck, Ticket, Home, History, HelpCircle } from 'lucide-react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isConnected, account, disconnect, provider } = useWallet();
  const { isAdmin } = useAdmin();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Function to handle clicking on the admin link - simplest direct check
  const handleAdminClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Always prevent default navigation
    
    // DIRECT CHECK 1: Is wallet connected?
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to access admin features.",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    
    // DIRECT CHECK 2: Is it the admin wallet?
    try {
      if (!provider || !account) {
        toast({
          title: "Wallet Error",
          description: "Error accessing wallet. Please try again.",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
      
      // Get network and contract information
      const network = await provider.getNetwork();
      const chainId = network.chainId.toString();
      const contract = getLotteryContract(provider, chainId);
      
      if (!contract) {
        toast({
          title: "Contract Error",
          description: "Could not access lottery contract. Please ensure you're on the correct network.",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
      
      // Get admin address directly from contract
      const adminAddress = await contract.admin();
      const isCurrentAdmin = adminAddress.toLowerCase() === account.toLowerCase();
      
      if (!isCurrentAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges. Please connect with the admin wallet.",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
      
      // Admin access granted, navigate to admin page
      console.log("Admin access granted, proceeding to admin page");
      setLocation("/admin");
    } catch (error) {
      console.error("Error verifying admin access:", error);
      toast({
        title: "Error",
        description: "Error checking admin status. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    }
  };
  
  const toggleMobileMenu = () => {
    setIsOpen(!isOpen);
  };

  // Custom link component to avoid nesting <a> tags
  const NavLink = ({ href, label, isMobile = false }: { href: string, label: string | React.ReactNode, isMobile?: boolean }) => {
    return (
      <Link href={href}>
        {isMobile ? (
          <span className="block px-3 py-2 text-white hover:bg-white hover:bg-opacity-10 rounded-md cursor-pointer">
            {label}
          </span>
        ) : (
          <span className={`text-white hover:text-accent transition cursor-pointer ${location === href ? 'text-accent' : ''}`}>
            {label}
          </span>
        )}
      </Link>
    );
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'backdrop-blur-lg' : ''}`}>
      {/* Gold accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary/30 via-primary to-primary/30"></div>
      
      {/* Header main content */}
      <div className="bg-secondary/95 backdrop-blur-md border-b border-primary/20 shadow-md">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <div className="relative animate-glow">
                  <Link href="/">
                    <div className="flex items-center cursor-pointer">
                      <img 
                        src="/images/lottologo.jpeg" 
                        alt="Company Logo" 
                        className="h-12 w-12 mr-3" 
                      />
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-yellow-500 to-amber-500 text-transparent bg-clip-text">
                          CryptoLotto
                        </h1>
                        <div className="text-xs text-primary/80 font-mono -mt-1">BLOCKCHAIN LOTTERY</div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <button 
            type="button" 
            className="lg:hidden text-white focus:outline-none"
            onClick={toggleMobileMenu}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <NavLink href="/" label={
              <span className="flex items-center px-3 py-2 rounded-md hover:bg-white/5">
                <Home className="mr-1.5 h-4 w-4" />
                Home
              </span>
            } />
            <NavLink href="/my-tickets" label={
              <span className="flex items-center px-3 py-2 rounded-md hover:bg-white/5">
                <Ticket className="mr-1.5 h-4 w-4" />
                My Tickets
              </span>
            } />
            <NavLink href="/history" label={
              <span className="flex items-center px-3 py-2 rounded-md hover:bg-white/5">
                <History className="mr-1.5 h-4 w-4" />
                History
              </span>
            } />
            <NavLink href="/faq" label={
              <span className="flex items-center px-3 py-2 rounded-md hover:bg-white/5">
                <HelpCircle className="mr-1.5 h-4 w-4" />
                FAQ
              </span>
            } />
            <Link href="/admin" onClick={handleAdminClick}>
              <div 
                className={`text-white hover:text-primary transition cursor-pointer flex items-center px-3 py-2 rounded-md hover:bg-white/5 ${location === '/admin' ? 'text-primary bg-white/5' : ''}`}
              >
                <ShieldCheck className="mr-1.5 h-4 w-4" />
                Admin
              </div>
            </Link>
          </nav>
          <appkit-button/>
          {/* Wallet Connection */}
          {/* <div className="hidden lg:block">
            {isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="btn-glow bg-card/60 border border-primary/30 rounded-full px-4 py-2 text-white">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                    <span className="truncate-address font-mono text-sm">
                      {account ? formatAddress(account) : ''}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border border-primary/20">
                  <DropdownMenuItem asChild>
                    <Link href="/my-tickets">
                      <span className="w-full cursor-pointer flex items-center">
                        <Ticket className="mr-2 h-4 w-4" />
                        My Tickets
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" onClick={handleAdminClick}>
                          <span className="w-full flex items-center">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Admin Panel
                          </span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={disconnect} className="cursor-pointer">
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => setShowWalletModal(true)} 
                className="btn-glow bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-600 hover:to-primary text-black font-bold rounded-full px-6 py-6 h-10 transition flex items-center shadow-lg"
              >
                <Wallet className="mr-2 h-5 w-5" />
                Connect Wallet
              </Button>
            )}
          </div> */}
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="lg:hidden">
          <div className="px-3 pt-3 pb-4 space-y-1 bg-secondary/95 backdrop-blur-md border-b border-primary/20">
            <NavLink href="/" label={
              <span className="flex items-center">
                <Home className="mr-2 h-5 w-5" />
                Home
              </span>
            } isMobile />
            <NavLink href="/my-tickets" label={
              <span className="flex items-center">
                <Ticket className="mr-2 h-5 w-5" />
                My Tickets
              </span>
            } isMobile />
            <NavLink href="/history" label={
              <span className="flex items-center">
                <History className="mr-2 h-5 w-5" />
                History
              </span>
            } isMobile />
            <NavLink href="/faq" label={
              <span className="flex items-center">
                <HelpCircle className="mr-2 h-5 w-5" />
                FAQ
              </span>
            } isMobile />
            <Link href="/admin" onClick={handleAdminClick}>
              <div 
                className="block px-3 py-2 text-white hover:bg-white/10 rounded-md cursor-pointer"
              >
                <span className="flex items-center">
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  Admin Panel
                </span>
              </div>
            </Link>
            
            {/* Mobile wallet connection */}
            {isConnected ? (
              <div className="mt-3 px-3 py-3 border border-primary/20 rounded-lg bg-card/60">
                <div className="flex items-center justify-between text-white mb-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                    <span className="font-mono text-sm">{account ? formatAddress(account) : ''}</span>
                  </div>
                </div>
                <Button 
                  onClick={disconnect} 
                  variant="outline"
                  className="w-full border-primary/30 text-white hover:bg-white/10"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setShowWalletModal(true)} 
                className="w-full mt-3 bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-600 hover:to-primary text-black font-bold rounded-full px-6 py-6 h-10 transition flex items-center justify-center shadow-lg"
              >
                <Wallet className="mr-2 h-5 w-5" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      )}
      
      <WalletModal open={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </header>
  );
}
