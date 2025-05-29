import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import MyTickets from "@/pages/MyTickets";
import History from "@/pages/History";
import FAQ from "@/pages/FAQ";
import Admin from "@/pages/Admin";
import { AppSettingsProvider } from "./context/AppSettingsContext";
import { WalletProvider } from "./context/WalletContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tickets" component={MyTickets} />
      <Route path="/my-tickets" component={MyTickets} />
      <Route path="/history" component={History} />
      <Route path="/faq" component={FAQ} />
      <Route path="/admin" component={Admin} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {

  return (
    <Layout>
      <Router />
    </Layout>
  );
}

function App() {
  return (
    <WalletProvider cookies={null}>
        <AppSettingsProvider>
          <AppContent />
          <Toaster />
        </AppSettingsProvider>
    </WalletProvider>
  );
}

export default App;
