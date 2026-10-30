import StatCard from '@/components/StatCard';
import { DollarSign, ArrowUpRight, ArrowDownLeft, CreditCard } from 'lucide-react';
import { useFinancialStats } from '@/hooks/useFinancialStats';
import { useTransactions } from '@/hooks/useTransactions';
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

  const { transactions } = useTransactions();
  const { formatCurrency } = useCurrency();

  const formatTrend = (trend: number) => Math.round(trend);

  // Prefer actual recorded totals so cards are never stuck at zero
  const displayIncome = totalIncome > 0 ? totalIncome : monthlyIncome;
  const displayExpenses = totalExpenses > 0 ? totalExpenses : monthlyExpenses;

  const incomeDescription =
    totalIncome > 0 && monthlyIncome === 0
      ? 'Total recorded'
      : monthlyIncome > 0
        ? 'This month'
        : 'No income yet';

  const expenseDescription =
    totalExpenses > 0 && monthlyExpenses === 0
      ? 'Total recorded'
      : monthlyExpenses > 0
        ? 'This month'
        : 'No expenses yet';

  // ---------- Recent Activity logic ----------
  // 1. Prefer last 7 days (pendingAmount)
  // 2. If empty, fall back to net of the most recent 10 transactions
  let recentActivityValue = pendingAmount;
  let recentActivityDescription = 'Last 7 days';

  if (pendingAmount === 0 && transactions.length > 0) {
    const recentTxs = [...transactions]
      .sort((a, b) => {
        // Try to sort by date first, fall back to id
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (!isNaN(dateA) && !isNaN(dateB)) return dateB - dateA;
        return b.id.localeCompare(a.id);
      })
      .slice(0, 10);

    const net = recentTxs.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);

    recentActivityValue = Math.abs(net);
    recentActivityDescription = `Last ${recentTxs.length} transactions`;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 compact-spacing">
      {/* Total Balance */}
      <div className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
        <StatCard
          title="Total Balance"
          value={formatCurrency(totalBalance)}
          description="Updated just now"
          icon={DollarSign}
          iconClassName="bg-primary/10 text-primary border border-primary/20"
        />
      </div>

      {/* Income */}
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

      {/* Expenses */}
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

      {/* Recent Activity */}
      <div className="animate-scale-in" style={{ animationDelay: '0.4s' }}>
        <StatCard
          title="Recent Activity"
          value={formatCurrency(recentActivityValue)}
          description={recentActivityDescription}
          icon={CreditCard}
          iconClassName="bg-warning/10 text-warning border border-warning/20"
        />
      </div>
    </div>
  );
}