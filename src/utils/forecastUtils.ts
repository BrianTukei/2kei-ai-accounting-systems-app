
import { Transaction } from '@/components/TransactionCard';
import { addMonths, format, parseISO, startOfMonth, endOfMonth, isBefore, isAfter } from 'date-fns';

export interface ForecastPoint {
  date: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface ForecastData {
  monthly: ForecastPoint[];
  totalIncome: number;
  totalExpenses: number;
  netGain: number;
  growthRate: number;
  expenseBreakdown: CategoryBreakdown[];
}

// Calculate forecast based on transaction history
export const generateForecastData = (
  transactions: Transaction[],
  recurringTransactions: any[] = [], // Keep for backward compatibility but don't use
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
    
    // Apply trend from historical data
    const projectedIncome = lastIncome * (1 + threeMonthsAvg.incomeGrowthRate);
    const projectedExpenses = lastExpenses * (1 + threeMonthsAvg.expenseGrowthRate);
    
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
  
  // Generate expense breakdown by category
  const expenseBreakdown = generateExpenseBreakdown(transactions, totalExpenses);
  
  return {
    monthly: forecastMonths,
    totalIncome,
    totalExpenses,
    netGain,
    growthRate: Number((growthRate * 100).toFixed(1)),
    expenseBreakdown
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

// Generate expense breakdown by category
const generateExpenseBreakdown = (transactions: Transaction[], totalProjectedExpenses: number): CategoryBreakdown[] => {
  // Filter expense transactions
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  if (expenseTransactions.length === 0) {
    // Return default breakdown if no expense data
    return [
      { category: 'Office Rent', amount: totalProjectedExpenses * 0.35, percentage: 35 },
      { category: 'Utilities', amount: totalProjectedExpenses * 0.20, percentage: 20 },
      { category: 'Office Supplies', amount: totalProjectedExpenses * 0.15, percentage: 15 },
      { category: 'Marketing', amount: totalProjectedExpenses * 0.15, percentage: 15 },
      { category: 'Equipment', amount: totalProjectedExpenses * 0.10, percentage: 10 },
      { category: 'Other', amount: totalProjectedExpenses * 0.05, percentage: 5 }
    ];
  }
  
  // Group expenses by their actual category from transaction data
  const categoryTotals: {[key: string]: number} = {};
  
  expenseTransactions.forEach(transaction => {
    const category = transaction.category || 'Other';
    categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
  });
  
  // Calculate total actual expenses
  const totalActualExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
  
  // Scale categories to match projected expenses
  const scaleFactor = totalActualExpenses > 0 ? totalProjectedExpenses / totalActualExpenses : 1;
  
  // Create breakdown with scaled amounts
  const breakdown = Object.entries(categoryTotals)
    .map(([category, amount]) => {
      const projectedAmount = amount * scaleFactor;
      return {
        category,
        amount: Number(projectedAmount.toFixed(2)),
        percentage: Number(((projectedAmount / totalProjectedExpenses) * 100).toFixed(1))
      };
    })
    .sort((a, b) => b.amount - a.amount); // Sort by amount descending
  
  // Ensure we have at least some categories to display
  if (breakdown.length === 0) {
    return [
      { category: 'General Expenses', amount: totalProjectedExpenses, percentage: 100 }
    ];
  }
  
  return breakdown;
};
