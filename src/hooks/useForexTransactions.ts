/**
 * useForexTransactions Hook
 * Handles fetching and updating forex rates for transactions
 */

import { useState, useCallback } from 'react';
import { Transaction } from '@/components/TransactionCard';

interface UpdatedTransaction extends Transaction {
  convertedAmount?: number;
  conversionRate?: number;
  lastUpdated?: string;
}

export function useForexTransactions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Update a single transaction with current forex rates
   */
  const updateTransactionRates = useCallback(
    async (
      transaction: Transaction,
      targetCurrency: string = 'USD'
    ): Promise<UpdatedTransaction | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/forex/update-transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: transaction.amount,
            fromCurrency: transaction.currency || transaction.original_currency || 'USD',
            toCurrency: targetCurrency,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch forex rates');
        }

        const data = await response.json();
        return {
          ...transaction,
          convertedAmount: data.data?.convertedAmount,
          conversionRate: data.data?.conversionRate,
          lastUpdated: data.data?.lastUpdated,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Update multiple transactions in batch with current forex rates
   */
  const updateTransactionsBatch = useCallback(
    async (
      transactions: Transaction[],
      targetCurrency: string = 'USD'
    ): Promise<UpdatedTransaction[]> => {
      try {
        setLoading(true);
        setError(null);

        const transactionsToUpdate = transactions.map((tx) => ({
          amount: tx.amount,
          currency: tx.currency || tx.original_currency || 'USD',
        }));

        const response = await fetch('/api/forex/batch-update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactions: transactionsToUpdate,
            toCurrency: targetCurrency,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to batch update forex rates');
        }

        const data = await response.json();
        
        return transactions.map((tx, idx) => ({
          ...tx,
          convertedAmount: data.data?.transactions?.[idx]?.convertedAmount,
          conversionRate: data.data?.transactions?.[idx]?.conversionRate,
          lastUpdated: data.data?.transactions?.[idx]?.lastUpdated,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return transactions;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get forex rate trend for currency pair
   */
  const getForexTrend = useCallback(
    async (
      fromCurrency: string,
      toCurrency: string,
      days: number = 7
    ): Promise<Array<{ date: string; rate: number }> | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/forex/trend?from=${fromCurrency}&to=${toCurrency}&days=${days}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch exchange rate trend');
        }

        const data = await response.json();
        return data.data?.trend || null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get forex statistics for dashboard
   */
  const getForexStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/forex/stats');

      if (!response.ok) {
        throw new Error('Failed to fetch forex statistics');
      }

      const data = await response.json();
      return data.data || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check if transaction data is stale (older than 30 minutes)
   */
  const isTransactionDataStale = useCallback((transaction: Transaction): boolean => {
    if (!transaction.lastUpdated) return true;
    
    const lastUpdateTime = new Date(transaction.lastUpdated).getTime();
    const now = Date.now();
    const thirtyMinutesMs = 30 * 60 * 1000;
    
    return now - lastUpdateTime > thirtyMinutesMs;
  }, []);

  return {
    loading,
    error,
    updateTransactionRates,
    updateTransactionsBatch,
    getForexTrend,
    getForexStats,
    isTransactionDataStale,
  };
}
