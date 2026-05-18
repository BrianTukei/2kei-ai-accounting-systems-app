import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { CurrencyProvider } from './contexts/CurrencyContext';

// Layout Components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
import FinancialAssistant from './pages/FinancialAssistant';
import BookDemo from './pages/BookDemo';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import AdminMessagingPanel from './components/admin/AdminMessagingPanel';
import EmailLogsDashboard from './components/admin/EmailLogsDashboard';
import EmailTemplates from './components/admin/EmailTemplates';

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <CurrencyProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/book-demo" element={<BookDemo />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="reports" element={<Reports />} />
              <Route path="ai-assistant" element={<FinancialAssistant />} />
              <Route path="settings" element={<Settings />} />
              <Route path="billing" element={<Billing />} />
              
              {/* Admin Routes */}
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/messaging" element={<AdminMessagingPanel />} />
              <Route path="admin/email-logs" element={<EmailLogsDashboard />} />
              <Route path="admin/templates" element={<EmailTemplates />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </CurrencyProvider>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;