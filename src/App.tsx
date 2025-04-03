import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import RecurringTransactions from './pages/RecurringTransactions';
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/recurring-transactions" element={<RecurringTransactions />} />
        <Route path="/forecast" element={<Forecast />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/statements/income" element={<IncomeStatement />} />
        <Route path="/statements/balance" element={<BalanceSheet />} />
        <Route path="/statements/cash-flow" element={<CashFlow />} />
        <Route path="/statements/trial-balance" element={<TrialBalance />} />
        <Route path="/statements/cash-book" element={<CashBook />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
