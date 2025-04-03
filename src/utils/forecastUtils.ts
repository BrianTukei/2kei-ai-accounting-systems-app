
import { Transaction } from '@/components/TransactionCard';
import { RecurringTransaction } from '@/types/RecurringTransaction';
import { addMonths, format, parseISO, startOfMonth, endOfMonth, isBefore, isAfter } from 'date-fns';

export interface ForecastPoint {
  date: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface ForecastData {
  monthly: ForecastPoint[];
  totalIncome: number;
  totalExpenses: number;
  netGain: number;
  growthRate: number;
}

// Calculate forecast based on transaction history and recurring transactions
export const generateForecastData = (
  transactions: Transaction[],
  recurringTransactions: RecurringTransaction[],
  months = 6
): ForecastData => {
  const now = new Date();
  const forecastMonths: ForecastPoint[] = [];
  
  // Initialize with current month's data
  let currentMonthIncome = 0;
  let currentMonthExpenses = 0;
  
  // Get current month's transactions
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  
  // Calculate current month's totals
  transactions.forEach(transaction => {
    // Parse transaction date, fallback to current date if invalid
    const transactionDate = transaction.date ? new Date(transaction.date) : now;
    
    if (
      isAfter(transactionDate, currentMonthStart) && 
      isBefore(transactionDate, currentMonthEnd)
    ) {
      if (transaction.type === 'income') {
        currentMonthIncome += transaction.amount;
      } else {
        currentMonthExpenses += transaction.amount;
      }
    }
  });
  
  // Add current month to forecast
  forecastMonths.push({
    date: format(now, 'MMM yyyy'),
    income: currentMonthIncome,
    expenses: currentMonthExpenses,
    balance: currentMonthIncome - currentMonthExpenses
  });
  
  // Calculate previous 3 months average change as baseline
  const threeMonthsAvg = calculatePreviousMonthsAverage(transactions, 3);
  
  // Generate forecast for future months
  let lastIncome = currentMonthIncome;
  let lastExpenses = currentMonthExpenses;
  
  for (let i = 1; i <= months; i++) {
    const forecastDate = addMonths(now, i);
    const monthRecurringIncome = getMonthlyRecurringAmount(recurringTransactions, 'income', forecastDate);
    const monthRecurringExpenses = getMonthlyRecurringAmount(recurringTransactions, 'expense', forecastDate);
    
    // Apply trend from historical data
    const projectedIncome = lastIncome * (1 + threeMonthsAvg.incomeGrowthRate) + monthRecurringIncome;
    const projectedExpenses = lastExpenses * (1 + threeMonthsAvg.expenseGrowthRate) + monthRecurringExpenses;
    
    const monthData: ForecastPoint = {
      date: format(forecastDate, 'MMM yyyy'),
      income: Number(projectedIncome.toFixed(2)),
      expenses: Number(projectedExpenses.toFixed(2)),
      balance: Number((projectedIncome - projectedExpenses).toFixed(2))
    };
    
    forecastMonths.push(monthData);
    
    // Update last values for next iteration
    lastIncome = projectedIncome;
    lastExpenses = projectedExpenses;
  }
  
  // Calculate totals for the forecast period
  const totalIncome = forecastMonths.reduce((sum, month) => sum + month.income, 0);
  const totalExpenses = forecastMonths.reduce((sum, month) => sum + month.expenses, 0);
  const netGain = totalIncome - totalExpenses;
  const growthRate = forecastMonths.length > 1 
    ? (forecastMonths[forecastMonths.length - 1].balance - forecastMonths[0].balance) / forecastMonths[0].balance 
    : 0;
  
  return {
    monthly: forecastMonths,
    totalIncome,
    totalExpenses,
    netGain,
    growthRate: Number((growthRate * 100).toFixed(1))
  };
};

// Calculate average growth rates from previous months
const calculatePreviousMonthsAverage = (transactions: Transaction[], monthsBack: number) => {
  const now = new Date();
  const monthlyTotals: {[key: string]: {income: number, expenses: number}} = {};
  
  // Group transactions by month
  transactions.forEach(transaction => {
    const transactionDate = transaction.date ? new Date(transaction.date) : now;
    const monthKey = format(transactionDate, 'yyyy-MM');
    
    if (!monthlyTotals[monthKey]) {
      monthlyTotals[monthKey] = { income: 0, expenses: 0 };
    }
    
    if (transaction.type === 'income') {
      monthlyTotals[monthKey].income += transaction.amount;
    } else {
      monthlyTotals[monthKey].expenses += transaction.amount;
    }
  });
  
  // Calculate month-over-month change rates
  const months = Object.keys(monthlyTotals).sort().slice(-monthsBack);
  let incomeChangeSum = 0;
  let expenseChangeSum = 0;
  let changeCount = 0;
  
  for (let i = 1; i < months.length; i++) {
    const prevMonth = monthlyTotals[months[i-1]];
    const currMonth = monthlyTotals[months[i]];
    
    if (prevMonth.income > 0) {
      incomeChangeSum += (currMonth.income - prevMonth.income) / prevMonth.income;
    }
    
    if (prevMonth.expenses > 0) {
      expenseChangeSum += (currMonth.expenses - prevMonth.expenses) / prevMonth.expenses;
    }
    
    changeCount++;
  }
  
  // Calculate average growth rates
  const avgIncomeGrowthRate = changeCount > 0 ? incomeChangeSum / changeCount : 0.02; // Default to 2% growth if no data
  const avgExpenseGrowthRate = changeCount > 0 ? expenseChangeSum / changeCount : 0.01; // Default to 1% growth if no data
  
  return {
    incomeGrowthRate: avgIncomeGrowthRate,
    expenseGrowthRate: avgExpenseGrowthRate
  };
};

// Calculate recurring transaction amounts for a specific month
const getMonthlyRecurringAmount = (
  recurringTransactions: RecurringTransaction[],
  type: 'income' | 'expense',
  targetMonth: Date
): number => {
  const monthStart = startOfMonth(targetMonth);
  const monthEnd = endOfMonth(targetMonth);
  
  return recurringTransactions
    .filter(rt => rt.type === type && rt.active)
    .reduce((total, rt) => {
      const nextDate = parseISO(rt.nextDate);
      
      // Count transactions that would occur in the target month
      let amount = 0;
      
      switch (rt.frequency) {
        case 'daily':
          // Approximate daily occurrences in a month
          amount = rt.amount * 30;
          break;
        case 'weekly':
          // Approximate weekly occurrences in a month
          amount = rt.amount * 4.33;
          break;
        case 'monthly':
          // Once per month
          amount = rt.amount;
          break;
        case 'quarterly':
          // Check if this quarter falls in this month
          if (nextDate.getMonth() % 3 === targetMonth.getMonth() % 3) {
            amount = rt.amount / 3; // Distribute quarterly amount across 3 months
          }
          break;
        case 'yearly':
          // Check if annual payment occurs in this month
          if (nextDate.getMonth() === targetMonth.getMonth()) {
            amount = rt.amount / 12; // Distribute annual amount across 12 months
          }
          break;
      }
      
      return total + amount;
    }, 0);
};
