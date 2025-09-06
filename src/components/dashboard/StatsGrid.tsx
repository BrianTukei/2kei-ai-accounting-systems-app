
import StatCard from '@/components/StatCard';
import { DollarSign, ArrowUpRight, ArrowDownLeft, CreditCard } from 'lucide-react';
import { useFinancialStats } from '@/hooks/useFinancialStats';

export default function StatsGrid() {
  const {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    pendingAmount,
    incomeGrowth,
    expenseGrowth
  } = useFinancialStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTrend = (trend: number) => {
    return Math.round(trend);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
        <StatCard 
          title="Total Balance" 
          value={formatCurrency(totalBalance)} 
          description="Updated just now" 
          icon={DollarSign}
          iconClassName="bg-primary/10 text-primary border border-primary/20"
        />
      </div>
      <div className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
        <StatCard 
          title="Income" 
          value={formatCurrency(monthlyIncome)} 
          description="This month" 
          trend={formatTrend(incomeGrowth)}
          icon={ArrowUpRight}
          iconClassName="bg-success/10 text-success border border-success/20"
        />
      </div>
      <div className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
        <StatCard 
          title="Expenses" 
          value={formatCurrency(monthlyExpenses)} 
          description="This month" 
          trend={formatTrend(expenseGrowth)}
          icon={ArrowDownLeft}
          iconClassName="bg-destructive/10 text-destructive border border-destructive/20"
        />
      </div>
      <div className="animate-scale-in" style={{ animationDelay: '0.4s' }}>
        <StatCard 
          title="Recent Activity" 
          value={formatCurrency(pendingAmount)} 
          description="Last 7 days" 
          icon={CreditCard}
          iconClassName="bg-warning/10 text-warning border border-warning/20"
        />
      </div>
    </div>
  );
}
