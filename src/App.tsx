
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import IncomeStatement from './pages/statements/IncomeStatement';
import BalanceSheet from './pages/statements/BalanceSheet';
import CashFlow from './pages/statements/CashFlow';
import TrialBalance from './pages/statements/TrialBalance';
import CashBook from './pages/statements/CashBook';
import NotFound from './pages/NotFound';
import Forecast from './pages/Forecast';
import Payroll from './pages/Payroll';
import AuthGuard from './components/auth/AuthGuard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        {/* Protected routes - require authentication */}
        <Route path="/transactions" element={<AuthGuard><Transactions /></AuthGuard>} />
        <Route path="/forecast" element={<AuthGuard><Forecast /></AuthGuard>} />
        <Route path="/reports" element={<AuthGuard><Reports /></AuthGuard>} />
        <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
        <Route path="/admin" element={<AuthGuard><AdminDashboard /></AuthGuard>} />
        <Route path="/income-statement" element={<AuthGuard><IncomeStatement /></AuthGuard>} />
        <Route path="/balance-sheet" element={<AuthGuard><BalanceSheet /></AuthGuard>} />
        <Route path="/cash-flow" element={<AuthGuard><CashFlow /></AuthGuard>} />
        <Route path="/trial-balance" element={<AuthGuard><TrialBalance /></AuthGuard>} />
        <Route path="/cash-book" element={<AuthGuard><CashBook /></AuthGuard>} />
        <Route path="/payroll" element={<AuthGuard><Payroll /></AuthGuard>} />
        
        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
