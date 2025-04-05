
import { Transaction } from '@/components/TransactionCard';
import { addMonths, format } from 'date-fns';

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

// Generate empty forecast data with placeholders
export const generateForecastData = (
  transactions: Transaction[],
  recurringTransactions: any[] = [],
  months = 6
): ForecastData => {
  const now = new Date();
  const forecastMonths: ForecastPoint[] = [];
  
  // Create empty forecast months
  for (let i = 0; i <= months; i++) {
    const forecastDate = i === 0 ? now : addMonths(now, i);
    forecastMonths.push({
      date: format(forecastDate, 'MMM yyyy'),
      income: 0,
      expenses: 0,
      balance: 0
    });
  }
  
  return {
    monthly: forecastMonths,
    totalIncome: 0,
    totalExpenses: 0,
    netGain: 0,
    growthRate: 0
  };
};

// This function is kept for backward compatibility but returns defaults
const calculatePreviousMonthsAverage = () => {
  return {
    incomeGrowthRate: 0,
    expenseGrowthRate: 0
  };
};
