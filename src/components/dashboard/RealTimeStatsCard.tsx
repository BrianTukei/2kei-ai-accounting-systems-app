import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinancialStats } from '@/hooks/useFinancialStats';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function RealTimeStatsCard() {
  const {
    totalIncome,
    totalExpenses,
    monthlyIncome,
    monthlyExpenses,
    incomeGrowth,
    expenseGrowth,
    categoryBreakdown
  } = useFinancialStats();

  const { formatCurrency } = useCurrency();

  const topExpenseCategory = categoryBreakdown[0];
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Financial Health Score
          </CardTitle>
          <CardDescription>Your current financial standing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Savings Rate</span>
              <span className={`font-semibold ${savingsRate > 20 ? 'text-success' : savingsRate > 10 ? 'text-warning' : 'text-destructive'}`}>
                {savingsRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Income Growth</span>
              <div className="flex items-center gap-1">
                {incomeGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className={`font-semibold ${incomeGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {Math.abs(incomeGrowth).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Top Expense</span>
              <span className="font-medium">
                {topExpenseCategory?.category || 'No data'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Monthly Summary
          </CardTitle>
          <CardDescription>Current month performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Income</span>
              <span className="font-semibold text-success">
                {formatCurrency(monthlyIncome)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Expenses</span>
              <span className="font-semibold text-destructive">
                {formatCurrency(monthlyExpenses)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="font-medium">Net Cash Flow</span>
              <span className={`font-bold ${monthlyIncome - monthlyExpenses >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(monthlyIncome - monthlyExpenses)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}