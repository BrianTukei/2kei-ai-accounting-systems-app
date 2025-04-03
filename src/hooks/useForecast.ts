
import { useEffect, useState } from 'react';
import { useTransactions } from './useTransactions';
import { generateForecastData, ForecastData } from '@/utils/forecastUtils';

export const useForecast = (months = 6) => {
  const { transactions } = useTransactions();
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (transactions.length > 0) {
      setIsLoading(true);
      
      // Use setTimeout to avoid blocking the UI during calculation
      setTimeout(() => {
        const data = generateForecastData(transactions, [], months);
        setForecastData(data);
        setIsLoading(false);
      }, 0);
    } else {
      setIsLoading(false);
    }
  }, [transactions, months]);

  return {
    forecastData,
    isLoading
  };
};
