
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import AdminAccessCard from '@/components/dashboard/AdminAccessCard';
import { Transaction } from '@/components/TransactionCard';
import { useTransactions } from '@/hooks/useTransactions';
import { isAuthenticated, isAdmin } from '@/utils/authUtils';
import { toast } from 'sonner';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { transactions, addTransaction } = useTransactions();
  const isUserAuthenticated = isAuthenticated();
  const isUserAdmin = isAdmin();

  // Most recent transactions first
  const recentTransactions = [...transactions].sort((a, b) => {
    return b.id.localeCompare(a.id);
  }).slice(0, 5);

  // Empty chart data template
  const getChartData = () => {
    return [
      { name: 'Jan', income: 0, expenses: 0 },
      { name: 'Feb', income: 0, expenses: 0 },
      { name: 'Mar', income: 0, expenses: 0 }
    ];
  };

  const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
    addTransaction(transaction);
    toast.success("Transaction added successfully");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <DashboardHeader 
          title="Dashboard" 
          subtitle={isUserAuthenticated 
            ? "Enter your financial data below to get started"
            : "Sign in to save your data and access all features"}
        />
        
        {/* Admin Access Card - only visible to admin */}
        {isUserAuthenticated && isUserAdmin && (
          <div className="mb-6">
            <AdminAccessCard />
          </div>
        )}
        
        <DashboardTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          chartData={getChartData()}
          recentTransactions={recentTransactions}
          onAddTransaction={handleAddTransaction}
        />
      </main>
    </div>
  );
}
