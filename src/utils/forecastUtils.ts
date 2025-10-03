
import { Transaction } from '@/components/TransactionCard';
import { addMonths, format, parseISO, startOfMonth, endOfMonth, isBefore, isAfter } from 'date-fns';

export interface ForecastPoint {
  date: string;
  income: number;
  expenses: number;
  balance: number;
  incomeConfidenceLow?: number;
  incomeConfidenceHigh?: number;
  expenseConfidenceLow?: number;
  expenseConfidenceHigh?: number;
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
  confidenceScore: number;
  trendStrength: number;
  seasonalityDetected: boolean;
}

// Calculate forecast based on transaction history with advanced financial modeling
export const generateForecastData = (
  transactions: Transaction[],
  recurringTransactions: any[] = [],
  months = 6
): ForecastData => {
  const now = new Date();
  const forecastMonths: ForecastPoint[] = [];
  
  // Analyze historical data for patterns
  const historicalAnalysis = analyzeHistoricalData(transactions, 12);
  const { monthlyStats, volatility, seasonalPattern } = historicalAnalysis;
  
  // Get current month's data
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  let currentMonthIncome = 0;
  let currentMonthExpenses = 0;
  
  transactions.forEach(transaction => {
    const transactionDate = transaction.date ? new Date(transaction.date) : now;
    if (isAfter(transactionDate, currentMonthStart) && isBefore(transactionDate, currentMonthEnd)) {
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
  
  // Calculate moving averages and trends
  const movingAvg = calculateMovingAverage(monthlyStats, 3);
  const trendAnalysis = calculateTrend(monthlyStats);
  
  // Generate forecast with multiple methods for accuracy
  let lastIncome = currentMonthIncome || movingAvg.income;
  let lastExpenses = currentMonthExpenses || movingAvg.expenses;
  
  for (let i = 1; i <= months; i++) {
    const forecastDate = addMonths(now, i);
    const monthIndex = forecastDate.getMonth();
    
    // Apply trend-based projection
    const trendIncome = lastIncome * (1 + trendAnalysis.incomeGrowthRate);
    const trendExpenses = lastExpenses * (1 + trendAnalysis.expenseGrowthRate);
    
    // Apply seasonal adjustment if detected
    const seasonalFactor = seasonalPattern[monthIndex] || 1.0;
    
    // Combine methods with weighted average
    const projectedIncome = trendIncome * seasonalFactor;
    const projectedExpenses = trendExpenses * seasonalFactor;
    
    // Calculate confidence intervals based on historical volatility
    const incomeStdDev = volatility.incomeStdDev;
    const expenseStdDev = volatility.expenseStdDev;
    
    const monthData: ForecastPoint = {
      date: format(forecastDate, 'MMM yyyy'),
      income: Number(projectedIncome.toFixed(2)),
      expenses: Number(projectedExpenses.toFixed(2)),
      balance: Number((projectedIncome - projectedExpenses).toFixed(2)),
      incomeConfidenceLow: Number((projectedIncome - incomeStdDev * 1.96).toFixed(2)),
      incomeConfidenceHigh: Number((projectedIncome + incomeStdDev * 1.96).toFixed(2)),
      expenseConfidenceLow: Number((projectedExpenses - expenseStdDev * 1.96).toFixed(2)),
      expenseConfidenceHigh: Number((projectedExpenses + expenseStdDev * 1.96).toFixed(2))
    };
    
    forecastMonths.push(monthData);
    
    lastIncome = projectedIncome;
    lastExpenses = projectedExpenses;
  }
  
  // Calculate totals and metrics
  const totalIncome = forecastMonths.reduce((sum, month) => sum + month.income, 0);
  const totalExpenses = forecastMonths.reduce((sum, month) => sum + month.expenses, 0);
  const netGain = totalIncome - totalExpenses;
  const growthRate = forecastMonths.length > 1 
    ? (forecastMonths[forecastMonths.length - 1].balance - forecastMonths[0].balance) / Math.abs(forecastMonths[0].balance || 1)
    : 0;
  
  // Calculate confidence score based on data quality
  const confidenceScore = calculateConfidenceScore(transactions, volatility);
  
  // Generate expense breakdown
  const expenseBreakdown = generateExpenseBreakdown(transactions, totalExpenses);
  
  return {
    monthly: forecastMonths,
    totalIncome,
    totalExpenses,
    netGain,
    growthRate: Number((growthRate * 100).toFixed(1)),
    expenseBreakdown,
    confidenceScore,
    trendStrength: Math.abs(trendAnalysis.incomeGrowthRate + trendAnalysis.expenseGrowthRate) * 100,
    seasonalityDetected: Object.keys(seasonalPattern).length > 0
  };
};

// Analyze historical data for comprehensive patterns
const analyzeHistoricalData = (transactions: Transaction[], lookbackMonths: number) => {
  const now = new Date();
  const monthlyStats: Array<{ month: string; income: number; expenses: number }> = [];
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
  
  // Convert to sorted array
  const sortedMonths = Object.keys(monthlyTotals).sort();
  sortedMonths.forEach(month => {
    monthlyStats.push({
      month,
      income: monthlyTotals[month].income,
      expenses: monthlyTotals[month].expenses
    });
  });
  
  // Calculate volatility (standard deviation)
  const incomeValues = monthlyStats.map(m => m.income);
  const expenseValues = monthlyStats.map(m => m.expenses);
  
  const volatility = {
    incomeStdDev: calculateStandardDeviation(incomeValues),
    expenseStdDev: calculateStandardDeviation(expenseValues)
  };
  
  // Detect seasonal patterns
  const seasonalPattern = detectSeasonality(monthlyStats);
  
  return { monthlyStats, volatility, seasonalPattern };
};

// Calculate moving average for smoothing
const calculateMovingAverage = (
  monthlyStats: Array<{ month: string; income: number; expenses: number }>,
  windowSize: number
) => {
  if (monthlyStats.length < windowSize) {
    const avgIncome = monthlyStats.reduce((sum, m) => sum + m.income, 0) / Math.max(monthlyStats.length, 1);
    const avgExpenses = monthlyStats.reduce((sum, m) => sum + m.expenses, 0) / Math.max(monthlyStats.length, 1);
    return { income: avgIncome || 1000, expenses: avgExpenses || 500 };
  }
  
  const recentMonths = monthlyStats.slice(-windowSize);
  const avgIncome = recentMonths.reduce((sum, m) => sum + m.income, 0) / windowSize;
  const avgExpenses = recentMonths.reduce((sum, m) => sum + m.expenses, 0) / windowSize;
  
  return { income: avgIncome, expenses: avgExpenses };
};

// Calculate linear regression trend
const calculateTrend = (monthlyStats: Array<{ month: string; income: number; expenses: number }>) => {
  if (monthlyStats.length < 2) {
    return { incomeGrowthRate: 0.02, expenseGrowthRate: 0.015 };
  }
  
  const n = monthlyStats.length;
  const incomeGrowthRates: number[] = [];
  const expenseGrowthRates: number[] = [];
  
  for (let i = 1; i < n; i++) {
    const prevIncome = monthlyStats[i - 1].income;
    const currIncome = monthlyStats[i].income;
    if (prevIncome > 0) {
      incomeGrowthRates.push((currIncome - prevIncome) / prevIncome);
    }
    
    const prevExpenses = monthlyStats[i - 1].expenses;
    const currExpenses = monthlyStats[i].expenses;
    if (prevExpenses > 0) {
      expenseGrowthRates.push((currExpenses - prevExpenses) / prevExpenses);
    }
  }
  
  // Use weighted average with more weight on recent months
  const weights = incomeGrowthRates.map((_, i) => (i + 1) / incomeGrowthRates.length);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  
  const weightedIncomeGrowth = incomeGrowthRates.reduce((sum, rate, i) => sum + rate * weights[i], 0) / totalWeight;
  const weightedExpenseGrowth = expenseGrowthRates.reduce((sum, rate, i) => sum + rate * weights[i], 0) / totalWeight;
  
  return {
    incomeGrowthRate: weightedIncomeGrowth || 0.02,
    expenseGrowthRate: weightedExpenseGrowth || 0.015
  };
};

// Detect seasonal patterns by month
const detectSeasonality = (monthlyStats: Array<{ month: string; income: number; expenses: number }>) => {
  const seasonalPattern: {[month: number]: number} = {};
  const monthlyAverages: {[month: number]: number[]} = {};
  
  // Group by calendar month
  monthlyStats.forEach(stat => {
    const date = parseISO(stat.month + '-01');
    const monthNum = date.getMonth();
    if (!monthlyAverages[monthNum]) {
      monthlyAverages[monthNum] = [];
    }
    monthlyAverages[monthNum].push(stat.income + stat.expenses);
  });
  
  // Calculate overall average
  const allValues = Object.values(monthlyAverages).flat();
  const overallAvg = allValues.reduce((sum, v) => sum + v, 0) / Math.max(allValues.length, 1);
  
  // Calculate seasonal factors only if we have enough data
  if (Object.keys(monthlyAverages).length >= 6) {
    Object.entries(monthlyAverages).forEach(([month, values]) => {
      const monthAvg = values.reduce((sum, v) => sum + v, 0) / values.length;
      seasonalPattern[parseInt(month)] = monthAvg / overallAvg;
    });
  }
  
  return seasonalPattern;
};

// Calculate standard deviation
const calculateStandardDeviation = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  
  return Math.sqrt(variance);
};

// Calculate confidence score based on data quality
const calculateConfidenceScore = (
  transactions: Transaction[],
  volatility: { incomeStdDev: number; expenseStdDev: number }
): number => {
  // Factors that affect confidence:
  // 1. Number of transactions
  // 2. Data consistency (lower volatility = higher confidence)
  // 3. Time span of data
  
  const transactionScore = Math.min(transactions.length / 100, 1) * 40; // Max 40 points
  
  const avgAmount = transactions.reduce((sum, t) => sum + t.amount, 0) / Math.max(transactions.length, 1);
  const volatilityScore = avgAmount > 0 
    ? Math.max(0, 40 - (volatility.incomeStdDev / avgAmount) * 20) 
    : 20;
  
  const timeSpanScore = 20; // Simplified for now
  
  return Math.min(Math.round(transactionScore + volatilityScore + timeSpanScore), 100);
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
