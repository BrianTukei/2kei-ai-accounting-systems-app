
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import RecurringTransactions from "./pages/RecurringTransactions";
import Reports from "./pages/Reports";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Settings from "./pages/Settings";
import IncomeStatement from "./pages/statements/IncomeStatement";
import CashFlow from "./pages/statements/CashFlow";
import BalanceSheet from "./pages/statements/BalanceSheet";
import TrialBalance from "./pages/statements/TrialBalance";
import CashBook from "./pages/statements/CashBook";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const user = localStorage.getItem('user');
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  const userData = JSON.parse(user);
  if (userData.email !== 'tukeibrian5@gmail.com') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Helmet>
          <title>2KÉI Ledgery Accounting</title>
          <meta name="description" content="2KÉI Ledgery Accounting - Smart financial management for your business" />
        </Helmet>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/recurring-transactions" element={<RecurringTransactions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/income-statement" element={<IncomeStatement />} />
            <Route path="/cash-flow" element={<CashFlow />} />
            <Route path="/balance-sheet" element={<BalanceSheet />} />
            <Route path="/trial-balance" element={<TrialBalance />} />
            <Route path="/cash-book" element={<CashBook />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
