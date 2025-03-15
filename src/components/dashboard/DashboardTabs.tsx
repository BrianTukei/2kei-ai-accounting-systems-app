
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import StatsGrid from './StatsGrid';
import OverviewChart from '@/components/OverviewChart';
import RecentTransactionsCard from './RecentTransactionsCard';
import QuickActionsCard from './QuickActionsCard';
import TransactionsTabContent from './TransactionsTabContent';
import ReportsTabContent from './ReportsTabContent';
import ReceiptScanner from '@/components/ReceiptScanner';
import { Transaction } from '@/components/TransactionCard';
import AddTransactionModal from '@/components/AddTransactionModal';

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  chartData: { name: string; income: number; expenses: number }[];
  recentTransactions: Transaction[];
  onAddTransaction?: (transaction: Transaction) => void;
}

export default function DashboardTabs({ 
  activeTab, 
  setActiveTab, 
  chartData, 
  recentTransactions,
  onAddTransaction
}: DashboardTabsProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');

  const handleOpenAddModal = (type: 'income' | 'expense') => {
    setTransactionType(type);
    setIsAddModalOpen(true);
  };

  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id'>) => {
    if (onAddTransaction) {
      // Generate a temporary ID (in a real app, this would come from the backend)
      const tempId = `temp-${Date.now()}`;
      onAddTransaction({ id: tempId, ...newTransaction });
    }
  };

  const handleScanComplete = (data: {
    amount: number;
    date: string;
    description: string;
    category: string;
  }) => {
    if (onAddTransaction) {
      // Convert scan data to a transaction
      const tempId = `temp-${Date.now()}`;
      onAddTransaction({
        id: tempId,
        amount: data.amount,
        type: 'expense', // Assume receipts are for expenses
        date: data.date,
        description: data.description,
        category: data.category
      });
    }
  };

  return (
    <>
      <Tabs 
        defaultValue="overview" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="glass-effect border border-slate-200/50 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 animate-scale-in">
          {/* Stats Cards */}
          <StatsGrid />
          
          {/* Chart Section */}
          <OverviewChart 
            data={chartData}
            title="Income vs Expenses"
            description="Financial performance over time"
          />
          
          {/* Quick Actions Buttons */}
          <div className="flex gap-4 mb-4">
            <Button
              className="flex-1 gap-2 bg-green-500 hover:bg-green-600"
              onClick={() => handleOpenAddModal('income')}
            >
              <ArrowUpRight className="h-5 w-5" />
              Add Income
            </Button>
            
            <Button
              className="flex-1 gap-2 bg-red-500 hover:bg-red-600"
              onClick={() => handleOpenAddModal('expense')}
            >
              <ArrowDownLeft className="h-5 w-5" />
              Add Expense
            </Button>
          </div>
          
          {/* Recent Transactions and Financial Statements */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RecentTransactionsCard transactions={recentTransactions} />
            <QuickActionsCard />
            <ReceiptScanner onScanComplete={handleScanComplete} />
          </div>
        </TabsContent>
        
        <TabsContent value="transactions" className="animate-scale-in">
          <TransactionsTabContent transactions={recentTransactions} />
        </TabsContent>
        
        <TabsContent value="reports" className="animate-scale-in">
          <ReportsTabContent />
        </TabsContent>
      </Tabs>
      
      <AddTransactionModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={(transaction) => {
          handleAddTransaction({
            ...transaction,
            type: transactionType
          });
        }}
      />
    </>
  );
}
