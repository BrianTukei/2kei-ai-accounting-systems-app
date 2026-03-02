
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import EmailConfirmation from './pages/EmailConfirmation';
import VerifyEmail from './pages/VerifyEmail';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserManagement from './pages/AdminUserManagement';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import IncomeStatement from './pages/statements/IncomeStatement';
import BalanceSheet from './pages/statements/BalanceSheet';
import CashFlow from './pages/statements/CashFlow';
import TrialBalance from './pages/statements/TrialBalance';
import CashBook from './pages/statements/CashBook';
import SignUp from './pages/SignUp';
import NotFound from './pages/NotFound';
import Forecast from './pages/Forecast';
import Payroll from './pages/Payroll';
import AIAssistant from './pages/AIAssistant';
import Invoices from './pages/Invoices';
import BankImport from './pages/BankImport';
import Journal from './pages/Journal';
import Onboarding from './pages/Onboarding';
import Billing from './pages/Billing';
import Team from './pages/Team';
import AcceptInvite from './pages/AcceptInvite';
import SuperAdmin from './pages/SuperAdmin';
import DeveloperAdminDashboard from './pages/DeveloperAdminDashboard';
import AdminTest from './pages/AdminTest';
import RecurringTransactions from './pages/RecurringTransactions';
import { InstallPrompt } from './components/pwa/InstallPrompt';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});
import { loadSampleData } from './utils/sampleData';
import { syncJournalFromTransactions } from './services/bookkeeping';
import { useRecurringTransactions } from './hooks/useRecurringTransactions';

function AppInner() {
  const { processDueTransactions, recurringTransactions } = useRecurringTransactions();

  // Load sample data once
  useEffect(() => { loadSampleData(); }, []);

  // Process recurring transactions AFTER hook state has loaded
  useEffect(() => {
    if (recurringTransactions.length === 0) return;

    const generated = processDueTransactions();
    if (generated.length > 0) {
      const stored = localStorage.getItem('finance-app-transactions');
      const existing = stored ? JSON.parse(stored) : [];
      const withIds = generated.map((t) => ({ ...t, id: Date.now().toString() + Math.random() }));
      localStorage.setItem('finance-app-transactions', JSON.stringify([...withIds, ...existing]));
    }

    const txStored = localStorage.getItem('finance-app-transactions');
    if (txStored) {
      try { syncJournalFromTransactions(JSON.parse(txStored)); } catch { /* ignore */ }
    }
  }, [recurringTransactions]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Routes>
      <Route path="/" element={<Index />} />

      {/* Auth */}
      <Route path="/auth"               element={<Auth />} />
      <Route path="/signup"             element={<SignUp />} />
      <Route path="/email-confirmation" element={<EmailConfirmation />} />
      <Route path="/verify-email"       element={<VerifyEmail />} />
      <Route path="/accept-invite"      element={<AcceptInvite />} />

      {/* Onboarding (protected but no org required) */}
      <Route path="/onboarding" element={<ProtectedRoute allowWithoutOrg><Onboarding /></ProtectedRoute>} />

      {/* Main app */}
      <Route path="/dashboard"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/transactions"   element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      <Route path="/forecast"       element={<ProtectedRoute><Forecast /></ProtectedRoute>} />
      <Route path="/reports"        element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/settings"       element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/payroll"        element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
      <Route path="/invoices"       element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
      <Route path="/bank-import"    element={<ProtectedRoute><BankImport /></ProtectedRoute>} />
      <Route path="/journal"        element={<ProtectedRoute><Journal /></ProtectedRoute>} />
      <Route path="/recurring-transactions" element={<ProtectedRoute><RecurringTransactions /></ProtectedRoute>} />
      <Route path="/ai-assistant"   element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />

      {/* SaaS */}
      <Route path="/billing"        element={<ProtectedRoute skipSubscriptionCheck><Billing /></ProtectedRoute>} />
      <Route path="/team"           element={<ProtectedRoute><Team /></ProtectedRoute>} />

      {/* Financial statements */}
      <Route path="/income-statement" element={<ProtectedRoute><IncomeStatement /></ProtectedRoute>} />
      <Route path="/balance-sheet"    element={<ProtectedRoute><BalanceSheet /></ProtectedRoute>} />
      <Route path="/cash-flow"        element={<ProtectedRoute><CashFlow /></ProtectedRoute>} />
      <Route path="/trial-balance"    element={<ProtectedRoute><TrialBalance /></ProtectedRoute>} />
      <Route path="/cash-book"        element={<ProtectedRoute><CashBook /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin"        element={<ProtectedRoute allowWithoutOrg><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users"  element={<ProtectedRoute allowWithoutOrg><AdminUserManagement /></ProtectedRoute>} />
      <Route path="/super-admin"  element={<ProtectedRoute allowWithoutOrg><SuperAdmin /></ProtectedRoute>} />
      <Route path="/dev-admin"    element={<ProtectedRoute allowWithoutOrg><DeveloperAdminDashboard /></ProtectedRoute>} />
      <Route path="/admin-test"   element={<ProtectedRoute allowWithoutOrg><AdminTest /></ProtectedRoute>} />

      {/* Legal */}
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms"   element={<Terms />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <OrganizationProvider>
            <AppInner />
            <InstallPrompt />
          </OrganizationProvider>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
