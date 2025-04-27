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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <AppSettingsProvider>
          <Layout>
            <Router />
          </Layout>
          <Toaster />
        </AppSettingsProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
