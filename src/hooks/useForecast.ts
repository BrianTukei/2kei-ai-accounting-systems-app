
import { useEffect, useState } from 'react';
import { useTransactions } from './useTransactions';
import { useRecurringTransactions } from './useRecurringTransactions';
import { generateForecastData, ForecastData } from '@/utils/forecastUtils';

export const useForecast = (months = 6) => {
  const { transactions } = useTransactions();
  const { recurringTransactions } = useRecurringTransactions();
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (transactions.length > 0 || recurringTransactions.length > 0) {
      setIsLoading(true);
      
      // Use setTimeout to avoid blocking the UI during calculation
      setTimeout(() => {
        const data = generateForecastData(transactions, recurringTransactions, months);
        setForecastData(data);
        setIsLoading(false);
      }, 0);
    } else {
      setIsLoading(false);
    }
  }, [transactions, recurringTransactions, months]);

  return {
    forecastData,
    isLoading
  };
};
