
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import { Transaction } from '@/components/TransactionCard';

// Mock data
const chartData = [
  { name: 'Jan', income: 4000, expenses: 2400 },
  { name: 'Feb', income: 3000, expenses: 1398 },
  { name: 'Mar', income: 5000, expenses: 3800 },
  { name: 'Apr', income: 2780, expenses: 3908 },
  { name: 'May', income: 5890, expenses: 4800 },
  { name: 'Jun', income: 3390, expenses: 2800 },
  { name: 'Jul', income: 4490, expenses: 3300 },
];

const recentTransactions: Transaction[] = [
  {
    id: '1',
    amount: 2500,
    type: 'income',
    category: 'Sales Revenue',
    description: 'Monthly product sales',
    date: 'Today'
  },
  {
    id: '2',
    amount: 1200,
    type: 'expense',
    category: 'Office Rent',
    description: 'Monthly office space rent',
    date: 'Yesterday'
  },
  {
    id: '3',
    amount: 750,
    type: 'expense',
    category: 'Utilities',
    description: 'Electricity and internet',
    date: '3 days ago'
  },
  {
    id: '4',
    amount: 3200,
    type: 'income',
    category: 'Client Payment',
    description: 'Project completion payment',
    date: '5 days ago'
  },
  {
    id: '5',
    amount: 420,
    type: 'expense',
    category: 'Office Supplies',
    description: 'Stationery and equipment',
    date: '1 week ago'
  },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

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
          chartData={chartData}
          recentTransactions={recentTransactions}
        />
      </main>
    </div>
  );
}
