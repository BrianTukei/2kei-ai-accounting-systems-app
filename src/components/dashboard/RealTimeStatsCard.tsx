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
    categoryBreakdown
  } = useFinancialStats();

  const { formatCurrency } = useCurrency();

  // Use real recorded totals when current month is empty
  const displayIncome = totalIncome > 0 ? totalIncome : monthlyIncome;
  const displayExpenses = totalExpenses > 0 ? totalExpenses : monthlyExpenses;
  const usingMonthly = monthlyIncome > 0 || monthlyExpenses > 0;

  const topExpenseCategory = categoryBreakdown[0];
  const savingsRate = displayIncome > 0
    ? ((displayIncome - displayExpenses) / displayIncome) * 100
    : 0;

  const summaryTitle = usingMonthly ? 'Monthly Summary' : 'Overall Summary';
  const summaryDescription = usingMonthly
    ? 'Current month performance'
    : 'Based on all recorded transactions';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Activity className="h-5 w-5 text-primary shrink-0" />
            Financial Health Score
          </CardTitle>
          <CardDescription>Your current financial standing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Savings Rate</span>
              <span className={`font-semibold text-sm sm:text-base ${savingsRate > 20 ? 'text-success' : savingsRate > 10 ? 'text-warning' : 'text-destructive'}`}>
                {savingsRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Income Growth</span>
              <div className="flex items-center gap-1">
                {incomeGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success shrink-0" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive shrink-0" />
                )}
                <span className={`font-semibold text-sm sm:text-base ${incomeGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {Math.abs(incomeGrowth).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Top Expense</span>
              <span className="font-medium text-sm sm:text-base truncate max-w-[140px] sm:max-w-none">
                {topExpenseCategory?.category || 'No data'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <DollarSign className="h-5 w-5 text-primary shrink-0" />
            {summaryTitle}
          </CardTitle>
          <CardDescription>{summaryDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Total Income</span>
              <span className="font-semibold text-success text-sm sm:text-base">
                {formatCurrency(displayIncome)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Total Expenses</span>
              <span className="font-semibold text-destructive text-sm sm:text-base">
                {formatCurrency(displayExpenses)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 border-t pt-2">
              <span className="font-medium text-sm sm:text-base">Net Cash Flow</span>
              <span className={`font-bold text-sm sm:text-base ${displayIncome - displayExpenses >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(displayIncome - displayExpenses)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}