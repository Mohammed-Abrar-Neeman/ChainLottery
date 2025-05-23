import React from 'react';
import Header from './Header';
import Footer from './Footer';
import PromoBanner from './PromoBanner';
import ContextProvider from '@/context' 

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <PromoBanner />
      <main className="container mx-auto px-4 py-8 flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
