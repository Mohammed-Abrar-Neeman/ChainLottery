import React, { useState } from 'react';
import { Link } from 'wouter';
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

  const toggleMobileMenu = () => {
    setIsOpen(!isOpen);
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

  return (
    <header className="sticky top-0 z-50">
      {/* Gold accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary/30 via-primary to-primary/30"></div>
      
      {/* Header main content */}
      <div className="bg-secondary/95 backdrop-blur-md border-b border-primary/20 shadow-md">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between">
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
            <NavLink href="/admin" label={
              <span className="flex items-center px-3 py-2 rounded-md hover:bg-white/5">
                <ShieldCheck className="mr-1.5 h-4 w-4" />
                Admin
              </span>
            } />
          </nav>

          {/* Wallet Connection Button */}
          <div className="hidden lg:block">
            <div className="border border-primary rounded-full p-[2px]">
              <appkit-button/>
            </div>
          </div>
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
            <NavLink href="/admin" label={
              <span className="flex items-center">
                <ShieldCheck className="mr-2 h-5 w-5" />
                Admin
              </span>
            } isMobile />
            
            {/* Mobile wallet connection */}
                <appkit-button/>
          </div>
        </div>
      )}
    </header>
  );
}
