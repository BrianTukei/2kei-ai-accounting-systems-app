
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import AdminAccessCard from '@/components/dashboard/AdminAccessCard';
import StatsGrid from '@/components/dashboard/StatsGrid';
import RealTimeStatsCard from '@/components/dashboard/RealTimeStatsCard';
import { Transaction } from '@/components/TransactionCard';
import { useTransactions } from '@/hooks/useTransactions';
import { useFinancialStats } from '@/hooks/useFinancialStats';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { transactions, addTransaction } = useTransactions();
  const { monthlyData } = useFinancialStats();
  const navigate = useNavigate();

  // Check if user is logged in (this would use your auth system in a real app)
  useEffect(() => {
    // For demo purposes, we're just checking localStorage
    const user = localStorage.getItem('user');
    if (!user) {
      toast.error("Please sign in to access your dashboard");
      navigate('/auth');
    }
  }, [navigate]);

  // Most recent transactions first
  const recentTransactions = [...transactions].sort((a, b) => {
    return b.id.localeCompare(a.id);
  }).slice(0, 5);

  const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
    addTransaction(transaction);
    toast.success(`New ${transaction.type} added successfully`);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-up">
          <DashboardHeader 
            title="Dashboard" 
            subtitle="Welcome back! Here's your financial overview."
          />
        </div>
        
        {/* Admin Access Card - only visible to admin */}
        <div className="mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <AdminAccessCard />
        </div>
        
        <StatsGrid />
        
        <RealTimeStatsCard />
        
        <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <DashboardTabs 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            chartData={monthlyData}
            recentTransactions={recentTransactions}
            onAddTransaction={handleAddTransaction}
          />
        </div>
      </main>
    </div>
  );
}
