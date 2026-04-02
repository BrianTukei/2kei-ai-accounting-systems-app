/**
 * Transaction Forex Display Component
 * Shows live currency conversion and forex rates for transactions
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Transaction {
  amount: number;
  currency: string;
  convertedAmount?: number;
  conversionRate?: number;
  lastUpdated?: string;
}

interface ForexDisplayProps {
  transaction: Transaction;
  targetCurrency?: string;
  showRate?: boolean;
  showLastUpdated?: boolean;
  compact?: boolean;
}

export default function TransactionForexDisplay({
  transaction,
  targetCurrency,
  showRate = true,
  showLastUpdated = true,
  compact = false,
}: ForexDisplayProps) {
  const { selectedCurrency, displayAmount } = useCurrency();
  const resolvedTargetCurrency = targetCurrency || selectedCurrency.code;
  const [updated, setUpdated] = useState(false);
  const [loading, setLoading] = useState(false);

  // Refresh transaction with current rates
  const refreshRates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/forex/update-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: transaction.amount,
          fromCurrency: transaction.currency,
          toCurrency: resolvedTargetCurrency,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        Object.assign(transaction, data);
        setUpdated(true);
        setTimeout(() => setUpdated(false), 2000);
      }
    } catch (error) {
      console.error('Failed to refresh rates', error);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div>
          <div className="text-sm font-semibold">
            {displayAmount(transaction.convertedAmount || 0, resolvedTargetCurrency, resolvedTargetCurrency)}
          </div>
          {showRate && (
            <div className="text-xs text-muted-foreground">
              @ {transaction.conversionRate?.toFixed(4)}
            </div>
          )}
        </div>
        <button
          onClick={refreshRates}
          disabled={loading}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          title="Refresh rates"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''} ${updated ? 'text-green-500' : ''}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Original Amount</div>
          <div className="text-xl font-bold">
            {displayAmount(transaction.amount || 0, transaction.currency, transaction.currency)}
          </div>
        </div>
        <button
          onClick={refreshRates}
          disabled={loading}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
          title="Refresh with current rates"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Conversion Arrow */}
      <div className="flex items-center gap-2 my-3">
        <div className="flex-1 border-t border-slate-300 dark:border-slate-600"></div>
        <div className="text-xs text-muted-foreground">at rate</div>
        <div className="flex-1 border-t border-slate-300 dark:border-slate-600"></div>
      </div>

      {/* Forex Rate */}
      {showRate && transaction.conversionRate && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded p-3 mb-3">
          <div className="text-xs text-muted-foreground mb-1">Exchange Rate</div>
          <div className="text-lg font-semibold">
            1 {transaction.currency} = {transaction.conversionRate.toFixed(4)} {resolvedTargetCurrency}
          </div>
        </div>
      )}

      {/* Converted Amount */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded p-3 mb-3">
        <div className="text-xs text-muted-foreground mb-1">Converted Amount</div>
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
          {displayAmount(transaction.convertedAmount || 0, resolvedTargetCurrency, resolvedTargetCurrency)}
        </div>
      </div>

      {/* Last Updated */}
      {showLastUpdated && transaction.lastUpdated && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <span>Updated:</span>
          <span>{new Date(transaction.lastUpdated).toLocaleTimeString()}</span>
          {updated && <Badge variant="outline" className="text-green-600">✓</Badge>}
        </div>
      )}

      {/* Warning for stale data */}
      {transaction.lastUpdated && (
        (() => {
          const minutes = Math.floor(
            (Date.now() - new Date(transaction.lastUpdated).getTime()) / 60000
          );
          if (minutes > 30) {
            return (
              <div className="mt-3 flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-700 dark:text-yellow-300">
                <AlertCircle className="w-4 h-4" />
                <span>Rates may be outdated ({minutes}m old)</span>
              </div>
            );
          }
        })()
      )}
    </div>
  );
}
