
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatsGrid from './StatsGrid';
import OverviewChart from '@/components/OverviewChart';
import RecentTransactionsCard from './RecentTransactionsCard';
import QuickActionsCard from './QuickActionsCard';
import TransactionsTabContent from './TransactionsTabContent';
import ReportsTabContent from './ReportsTabContent';
import { Transaction } from '@/components/TransactionCard';

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  chartData: { name: string; income: number; expenses: number }[];
  recentTransactions: Transaction[];
}

export default function DashboardTabs({ 
  activeTab, 
  setActiveTab, 
  chartData, 
  recentTransactions 
}: DashboardTabsProps) {
  return (
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
        
        {/* Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecentTransactionsCard transactions={recentTransactions} />
          <QuickActionsCard />
        </div>
      </TabsContent>
      
      <TabsContent value="transactions" className="animate-scale-in">
        <TransactionsTabContent transactions={recentTransactions} />
      </TabsContent>
      
      <TabsContent value="reports" className="animate-scale-in">
        <ReportsTabContent />
      </TabsContent>
    </Tabs>
  );
}
