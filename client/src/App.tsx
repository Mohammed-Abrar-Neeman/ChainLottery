import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import MyTickets from "@/pages/MyTickets";
import History from "@/pages/History";
import ScalableHistory from "@/pages/ScalableHistory";
import FAQ from "@/pages/FAQ";
import Admin from "@/pages/Admin";
import ManualSelection from "@/pages/ManualSelection";
import { AppSettingsProvider } from "./context/AppSettingsContext";
import { WalletProvider } from "./context/WalletContext";
import { useWallet } from './hooks/useWallet';
import { useState } from 'react';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tickets" component={MyTickets} />
      <Route path="/my-tickets" component={MyTickets} />
      <Route path="/history" component={History} />
      <Route path="/history-v2" component={ScalableHistory} />
      <Route path="/faq" component={FAQ} />
      <Route path="/admin" component={Admin} />
      <Route path="/pick-numbers" component={ManualSelection} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function WrongNetworkBanner({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ background: '#ffcc00', color: '#222', padding: '12px', textAlign: 'center', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1001 }}>
      <strong>Wrong Network:</strong> Please switch your wallet to <b>Sepolia Testnet</b>.
      <button style={{ marginLeft: 16, background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' }} onClick={onClose}>Dismiss</button>
    </div>
  );
}

function WrongNetworkModal() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#222', color: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 24px #000', maxWidth: 400, textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Wrong Network</h2>
        <p style={{ fontSize: 18, marginBottom: 24 }}>Please switch your wallet to <b>Sepolia Testnet</b> to use the app.</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { isWrongNetwork } = useWallet();
  const [showBanner, setShowBanner] = useState(true);

  if (isWrongNetwork) {
    return <>
      {showBanner && <WrongNetworkBanner onClose={() => setShowBanner(false)} />}
      <WrongNetworkModal />
    </>;
  }

  return (
    <Layout>
      <Router />
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <AppSettingsProvider>
          <AppContent />
          <Toaster />
        </AppSettingsProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
