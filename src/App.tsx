
import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { useAuth } from './contexts/AuthContext';
import { useOrganization } from './contexts/OrganizationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
const Reports = lazy(() => import('./pages/Reports'));
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import EmailConfirmation from './pages/EmailConfirmation';
import VerifyEmail from './pages/VerifyEmail';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserManagement from './pages/AdminUserManagement';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
const IncomeStatement = lazy(() => import('./pages/statements/IncomeStatement'));
const BalanceSheet = lazy(() => import('./pages/statements/BalanceSheet'));
const CashFlow = lazy(() => import('./pages/statements/CashFlow'));
const TrialBalance = lazy(() => import('./pages/statements/TrialBalance'));
const CashBook = lazy(() => import('./pages/statements/CashBook'));
import SignUp from './pages/SignUp';
import NotFound from './pages/NotFound';
const Forecast = lazy(() => import('./pages/Forecast'));
const Payroll = lazy(() => import('./pages/Payroll'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const LocalAIAssistant = lazy(() => import('./pages/LocalAIAssistant'));
const AIAccountantPage = lazy(() => import('./pages/AIAccountantPage'));
const AIReceiptScannerPage = lazy(() => import('./pages/AIReceiptScannerPage'));
const ActionAIPage = lazy(() => import('./pages/ActionAIPage'));
// EnhancedAIChat loaded via EnhancedAIChatPage
const Invoices = lazy(() => import('./pages/Invoices'));
const BankImport = lazy(() => import('./pages/BankImport'));
const Journal = lazy(() => import('./pages/Journal'));
import Onboarding from './pages/Onboarding';
import Billing from './pages/Billing';
import Team from './pages/Team';
import AcceptInvite from './pages/AcceptInvite';
const SuperAdmin = lazy(() => import('./pages/SuperAdmin'));
const DeveloperAdminDashboard = lazy(() => import('./pages/DeveloperAdminDashboard'));
import AdminTest from './pages/AdminTest';
const AdminBilling = lazy(() => import('./pages/AdminBilling'));
const AdminExchangeRates = lazy(() => import('./pages/AdminExchangeRates'));
const AdminEmailSubscribers = lazy(() => import('./pages/AdminEmailSubscribers'));
const AdminDemoPage = lazy(() => import('./pages/AdminDemoPage'));
const RecurringTransactions = lazy(() => import('./pages/RecurringTransactions'));
const EnhancedAIChatPage = lazy(() => import('./pages/EnhancedAIChatPage'));
const AutonomousBookkeepingPage = lazy(() => import('./pages/AutonomousBookkeepingPage'));
import BookDemo from './pages/BookDemo';
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
import orgStorage, { STORAGE_KEYS } from './lib/orgStorage';

function AppInner() {
  const { processDueTransactions, recurringTransactions } = useRecurringTransactions();
  const { user } = useAuth();
  const { org } = useOrganization();

  // Load sample data once
  useEffect(() => { loadSampleData(); }, []);

  // Process recurring transactions AFTER hook state has loaded
  useEffect(() => {
    if (recurringTransactions.length === 0) return;

    const generated = processDueTransactions();
    if (generated.length > 0) {
      if (!user || !org) return;
      const existing = orgStorage.getJSON<any[]>(org.id, STORAGE_KEYS.TRANSACTIONS, []);
      const withIds = generated.map((t) => ({ ...t, id: Date.now().toString() + Math.random() }));
      orgStorage.setJSON(org.id, STORAGE_KEYS.TRANSACTIONS, [...withIds, ...existing]);
    }

    if (user && org) {
      const transactions = orgStorage.getJSON<any[]>(org.id, STORAGE_KEYS.TRANSACTIONS, []);
      try { syncJournalFromTransactions(transactions); } catch { /* ignore */ }
    }
  }, [recurringTransactions, user, org]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    }>
    <Routes>
      <Route path="/" element={<Index />} />

      {/* Auth */}
      <Route path="/auth"               element={<Auth />} />
      <Route path="/signup"             element={<SignUp />} />
      <Route path="/email-confirmation" element={<EmailConfirmation />} />
      <Route path="/verify-email"       element={<VerifyEmail />} />
      <Route path="/accept-invite"      element={<AcceptInvite />} />
      <Route path="/book-demo"          element={<BookDemo />} />

      {/* Onboarding (protected but no org required) */}
      <Route path="/onboarding" element={<ProtectedRoute allowWithoutOrg><Onboarding /></ProtectedRoute>} />

      {/* Main app — free tier accessible */}
      <Route path="/dashboard"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/transactions"   element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      <Route path="/settings"       element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/invoices"       element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
      <Route path="/journal"        element={<ProtectedRoute><Journal /></ProtectedRoute>} />

      {/* Premium features — require active paid subscription */}
      <Route path="/forecast"       element={<ProtectedRoute requireActiveSubscription><Forecast /></ProtectedRoute>} />
      <Route path="/reports"        element={<ProtectedRoute requireActiveSubscription><Reports /></ProtectedRoute>} />
      <Route path="/payroll"        element={<ProtectedRoute requireActiveSubscription><Payroll /></ProtectedRoute>} />
      <Route path="/bank-import"    element={<ProtectedRoute requireActiveSubscription><BankImport /></ProtectedRoute>} />
      <Route path="/recurring-transactions" element={<ProtectedRoute requireActiveSubscription><RecurringTransactions /></ProtectedRoute>} />
      <Route path="/ai-assistant"   element={<ProtectedRoute requireActiveSubscription><AIAssistant /></ProtectedRoute>} />
      <Route path="/local-ai"        element={<ProtectedRoute><LocalAIAssistant /></ProtectedRoute>} />
      <Route path="/ai-accountant"    element={<ProtectedRoute><AIAccountantPage /></ProtectedRoute>} />
      <Route path="/ai-receipt-scanner" element={<ProtectedRoute><AIReceiptScannerPage /></ProtectedRoute>} />
      <Route path="/action-ai"       element={<ProtectedRoute><ActionAIPage /></ProtectedRoute>} />
      <Route path="/enhanced-ai-chat" element={<ProtectedRoute><EnhancedAIChatPage /></ProtectedRoute>} />
      <Route path="/team"           element={<ProtectedRoute requireActiveSubscription><Team /></ProtectedRoute>} />

      {/* SaaS — billing (exempt from subscription check to avoid loops) */}
      <Route path="/billing"        element={<ProtectedRoute skipSubscriptionCheck><Billing /></ProtectedRoute>} />

      {/* Financial statements */}
      <Route path="/income-statement" element={<ProtectedRoute><IncomeStatement /></ProtectedRoute>} />
      <Route path="/balance-sheet"    element={<ProtectedRoute><BalanceSheet /></ProtectedRoute>} />
      <Route path="/cash-flow"        element={<ProtectedRoute><CashFlow /></ProtectedRoute>} />
      <Route path="/trial-balance"    element={<ProtectedRoute><TrialBalance /></ProtectedRoute>} />
      <Route path="/cash-book"        element={<ProtectedRoute><CashBook /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin"        element={<ProtectedRoute allowWithoutOrg><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users"  element={<ProtectedRoute allowWithoutOrg><AdminUserManagement /></ProtectedRoute>} />
      <Route path="/admin/demos"  element={<ProtectedRoute allowWithoutOrg><AdminDemoPage /></ProtectedRoute>} />
      <Route path="/admin/autonomous" element={<ProtectedRoute allowWithoutOrg><AutonomousBookkeepingPage /></ProtectedRoute>} />
      <Route path="/super-admin"  element={<ProtectedRoute allowWithoutOrg><SuperAdmin /></ProtectedRoute>} />
      <Route path="/dev-admin"    element={<ProtectedRoute allowWithoutOrg><DeveloperAdminDashboard /></ProtectedRoute>} />
      <Route path="/admin-test"   element={<ProtectedRoute allowWithoutOrg><AdminTest /></ProtectedRoute>} />
      <Route path="/admin/billing" element={<ProtectedRoute allowWithoutOrg><AdminBilling /></ProtectedRoute>} />
      <Route path="/admin/exchange-rates" element={<ProtectedRoute allowWithoutOrg><AdminExchangeRates /></ProtectedRoute>} />
      <Route path="/admin/email-subscribers" element={<ProtectedRoute allowWithoutOrg><AdminEmailSubscribers /></ProtectedRoute>} />

      {/* Legal */}
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms"   element={<Terms />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
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
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}

export default App;
