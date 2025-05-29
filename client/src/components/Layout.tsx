import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import Header from './Header';
import Footer from './Footer';
import PromoBanner from './PromoBanner';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [location] = useLocation();
  const [mounted, setMounted] = useState(false);
  const isHomePage = location === '/';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      console.log('Route changed:', {
        pathname: location,
        isHomePage
      });
    }
  }, [location, isHomePage, mounted]);

  // Don't render anything until mounted to avoid hydration mismatches
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {isHomePage && <PromoBanner />}
      <main className="container mx-auto px-8 md:px-12 lg:px-16 py-8 flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
