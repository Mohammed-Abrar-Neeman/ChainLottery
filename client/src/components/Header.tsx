import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Wallet, Menu, X, ShieldCheck, Ticket, Home, History, HelpCircle, BookOpen } from 'lucide-react';
import { useAppKitAccount, useAppKit } from "@reown/appkit/react";
import { useLotteryContract } from '@/hooks/useLotteryContract';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // AppKit hooks
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const { checkIsAdmin } = useLotteryContract();

  // Check admin status
  const checkAdminStatus = async () => {
    try {
      setIsLoading(true);
      const isUserAdmin = await checkIsAdmin();
      setIsAdmin(isUserAdmin);
    } catch (error) {
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to check admin status when connection changes
  useEffect(() => {
    if (isConnected && address) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
      setIsLoading(false);
    }
  }, [isConnected, address]);

  const toggleMobileMenu = () => {
    setIsOpen(!isOpen);
  };

  // Utility to truncate address
  const truncateAddress = (addr: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  // Custom wallet button (no balance)
  const WalletButton = () => {
    if (!isConnected) {
      return (
        <Button
          variant="outline"
          className="bg-primary/10 text-primary border-primary hover:bg-primary/20 rounded-full px-4 py-2 font-semibold"
          onClick={() => open()}
        >
          <Wallet className="inline-block mr-2 h-5 w-5" /> Connect Wallet
        </Button>
      );
    }
    return (
      <Button
            variant="outline"
            className="bg-primary/10 text-primary border-primary hover:bg-primary/20 rounded-full px-4 py-2 font-mono font-semibold"
            onClick={() => open()}
          >
            <Wallet className="inline-block mr-2 h-5 w-5" /> {truncateAddress(address || '')}
          </Button>
    );
  };

  // Custom link component for navigation
  const NavLink = ({ href, label, isMobile = false }: { href: string, label: string | React.ReactNode, isMobile?: boolean }) => {
    return (
      <Link href={href}>
        {isMobile ? (
          <span className="block px-3 py-2 text-white hover:bg-white hover:bg-opacity-10 rounded-md cursor-pointer">
            {label}
          </span>
        ) : (
          <span className="text-white hover:text-accent transition cursor-pointer">
            {label}
          </span>
        )}
      </Link>
    );
  };

  // Admin menu item component
  const AdminMenuItem = ({ isMobile = false }: { isMobile?: boolean }) => {
   
    
    if (!isAdmin) {
      return null;
    }
    
    return (
      <NavLink href="/admin" label={
        <span className={`flex items-center ${isMobile ? '' : 'px-3 py-2 rounded-md hover:bg-white/5'}`}>
          <ShieldCheck className={`${isMobile ? 'mr-2 h-5 w-5' : 'mr-1.5 h-4 w-4'}`} />
          Admin
        </span>
      } isMobile={isMobile} />
    );
  };

  return (
    <header className="bg-[hsl(220,13%,12%)] border-b border-border">
      <div className="container mx-auto px-8 md:px-12 lg:px-16">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
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
            <NavLink href="/blogs" label={
              <span className="flex items-center px-3 py-2 rounded-md hover:bg-white/5">
                <BookOpen className="mr-1.5 h-4 w-4" />
                Blogs
              </span>
            } />
            <AdminMenuItem />
          </nav>

          {/* Wallet Connection Button */}
          <div className="hidden lg:block">
            <div className="border border-primary rounded-full p-[2px]">
              <WalletButton />
            </div>
          </div>
        </nav>
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
            <NavLink href="/blogs" label={
              <span className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Blogs
              </span>
            } isMobile />
            <AdminMenuItem isMobile />
            
            {/* Mobile wallet connection */}
            <WalletButton />
          </div>
        </div>
      )}
    </header>
  );
}
