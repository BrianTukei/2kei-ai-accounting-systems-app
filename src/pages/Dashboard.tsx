
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import { Transaction } from '@/components/TransactionCard';
import { useTransactions } from '@/hooks/useTransactions';
import { toast } from 'sonner';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { transactions, addTransaction } = useTransactions();

  // Most recent transactions first
  const recentTransactions = [...transactions].sort((a, b) => {
    // This is simplified - in a real app we'd have proper date objects
    return b.id.localeCompare(a.id);
  }).slice(0, 5);

  // Calculate chart data based on transactions
  const getChartData = () => {
    // Group transactions by month
    const monthlyData = transactions.reduce((acc, transaction) => {
      // In a real app, we'd use actual dates, but for this example, we'll group by categories
      const month = transaction.date || 'Unknown';
      
      if (!acc[month]) {
        acc[month] = { income: 0, expenses: 0 };
      }
      
      if (transaction.type === 'income') {
        acc[month].income += transaction.amount;
      } else {
        acc[month].expenses += transaction.amount;
      }
      
      return acc;
    }, {} as Record<string, { income: number, expenses: number }>);
    
    // Convert to array format for chart
    return Object.entries(monthlyData).map(([month, data]) => ({
      name: month,
      income: data.income,
      expenses: data.expenses
    }));
  };

  const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
    addTransaction(transaction);
    toast.success(`New ${transaction.type} added successfully`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <DashboardHeader 
          title="Dashboard" 
          subtitle="Welcome back! Here's your financial overview."
        />
        
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
