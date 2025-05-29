import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import MyTickets from "@/pages/MyTickets";
import History from "@/pages/History";
import FAQ from "@/pages/FAQ";
import Admin from "@/pages/Admin";
import Blogs from "@/pages/Blogs";
import BlogPost from "@/pages/BlogPost";
import { WalletProvider } from "./context/WalletContext";
import Contact from "@/pages/Contact";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tickets" component={MyTickets} />
      <Route path="/my-tickets" component={MyTickets} />
      <Route path="/history" component={History} />
      <Route path="/faq" component={FAQ} />
      <Route path="/admin" component={Admin} />
      <Route path="/blogs" component={Blogs} />
      <Route path="/blogs/:id" component={BlogPost} />
      <Route path="/contact" component={Contact} />
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
          <AppContent />
          <Toaster />
    </WalletProvider>
  );
}

export default App;
