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
    incomeGrowth,
    expenseGrowth
  } = useFinancialStats();

  const { transactions } = useTransactions();
  const { formatCurrency, selectedCurrency } = useCurrency();

  const formatTrend = (trend: number) => Math.round(trend);

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

  let recentActivityValue = 0;
  let recentActivityDescription = 'No recent activity';

  if (transactions && transactions.length > 0) {
    const getTime = (t: any) => {
      const d = new Date(t.date);
      if (!isNaN(d.getTime())) return d.getTime();
      return Number(t.id) || 0;
    };

    const sorted = [...transactions].sort((a, b) => getTime(b) - getTime(a));

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const last7Days = sorted.filter(t => getTime(t) >= sevenDaysAgo);

    let selected = last7Days;
    let label = 'Last 7 days';

    if (selected.length === 0) {
      selected = sorted.slice(0, 10);
      label = `Last ${selected.length} transactions`;
    }

    const net = selected.reduce((sum, t) => {
      const amount = Number(t.amount) || 0;
      return sum + (t.type === 'income' ? amount : -amount);
    }, 0);

    const volume = selected.reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);

    recentActivityValue = net !== 0 ? Math.abs(net) : volume;
    recentActivityDescription = label;
  }

  const fmt = (value: number) => formatCurrency(value, selectedCurrency.code);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 compact-spacing">
      <div className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
        <StatCard
          title="Total Balance"
          value={fmt(totalBalance)}
          description="Updated just now"
          icon={DollarSign}
          iconClassName="bg-primary/10 text-primary border border-primary/20"
        />
      </div>

      <div className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
        <StatCard
          title="Income"
          value={fmt(displayIncome)}
          description={incomeDescription}
          trend={monthlyIncome > 0 ? formatTrend(incomeGrowth) : undefined}
          icon={ArrowUpRight}
          iconClassName="bg-success/10 text-success border border-success/20"
        />
      </div>

      <div className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
        <StatCard
          title="Expenses"
          value={fmt(displayExpenses)}
          description={expenseDescription}
          trend={monthlyExpenses > 0 ? formatTrend(expenseGrowth) : undefined}
          icon={ArrowDownLeft}
          iconClassName="bg-destructive/10 text-destructive border border-destructive/20"
        />
      </div>

      <div className="animate-scale-in" style={{ animationDelay: '0.4s' }}>
        <StatCard
          title="Recent Activity"
          value={fmt(recentActivityValue)}
          description={recentActivityDescription}
          icon={CreditCard}
          iconClassName="bg-warning/10 text-warning border border-warning/20"
        />
      </div>
    </div>
  );
}