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
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Router />
      </Layout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
