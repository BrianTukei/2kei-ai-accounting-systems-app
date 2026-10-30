import StatCard from '@/components/StatCard';
import { DollarSign, ArrowUpRight, ArrowDownLeft, CreditCard } from 'lucide-react';
import { useFinancialStats } from '@/hooks/useFinancialStats';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function StatsGrid() {
  const {
    totalBalance,
    totalIncome,
    totalExpenses,
    monthlyIncome,
    monthlyExpenses,
    pendingAmount,
    incomeGrowth,
    expenseGrowth
  } = useFinancialStats();
  
  const { formatCurrency } = useCurrency();

  const formatTrend = (trend: number) => Math.round(trend);

  // Prefer actual recorded totals so cards are never stuck at zero
  const displayIncome = totalIncome > 0 ? totalIncome : monthlyIncome;
  const displayExpenses = totalExpenses > 0 ? totalExpenses : monthlyExpenses;

  const incomeDescription = totalIncome > 0 && monthlyIncome === 0
    ? 'Total recorded'
    : monthlyIncome > 0
      ? 'This month'
      : 'No income yet';

  const expenseDescription = totalExpenses > 0 && monthlyExpenses === 0
    ? 'Total recorded'
    : monthlyExpenses > 0
      ? 'This month'
      : 'No expenses yet';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 compact-spacing">
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
          value={formatCurrency(displayIncome)} 
          description={incomeDescription}
          trend={monthlyIncome > 0 ? formatTrend(incomeGrowth) : undefined}
          icon={ArrowUpRight}
          iconClassName="bg-success/10 text-success border border-success/20"
        />
      </div>
      <div className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
        <StatCard 
          title="Expenses" 
          value={formatCurrency(displayExpenses)} 
          description={expenseDescription}
          trend={monthlyExpenses > 0 ? formatTrend(expenseGrowth) : undefined}
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