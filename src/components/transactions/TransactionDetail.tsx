/**
 * Transaction Detail Component with Forex Display
 * Shows detailed information about a transaction including forex conversion
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/components/TransactionCard';
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle, Calendar, Tag } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useForexTransactions } from '@/hooks/useForexTransactions';
import { useCurrency } from '@/contexts/CurrencyContext';

interface TransactionDetailProps {
  transaction: Transaction;
  onClose?: () => void;
}

export default function TransactionDetail({ transaction, onClose }: TransactionDetailProps) {
  const { formatCurrency } = useCurrency();
  const { updateTransactionRates, getForexTrend, isTransactionDataStale, loading } = useForexTransactions();
  const [currentTransaction, setCurrentTransaction] = useState<Transaction & { convertedAmount?: number; conversionRate?: number; lastUpdated?: string }>(transaction);
  const [trendData, setTrendData] = useState<Array<{ date: string; rate: number }> | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);

  // Fetch updated rates and trend data
  useEffect(() => {
    const fetchData = async () => {
      const baseCurrency = transaction.original_currency || transaction.currency || 'USD';
      const targetCurrency = 'USD';

      // Fetch updated rates
      const updated = await updateTransactionRates(transaction, targetCurrency);
      if (updated) {
        setCurrentTransaction(updated);
      }

      // Fetch trend data
      if (baseCurrency !== targetCurrency) {
        setTrendLoading(true);
        const trend = await getForexTrend(baseCurrency, targetCurrency, 7);
        setTrendData(trend);
        setTrendLoading(false);
      }
    };

    fetchData();
  }, [transaction, updateTransactionRates, getForexTrend]);

  const isStale = isTransactionDataStale(currentTransaction);
  const isIncome = transaction.type === 'income';
  const baseCurrency = transaction.original_currency || transaction.currency || 'USD';

  const handleRefresh = async () => {
    const updated = await updateTransactionRates(currentTransaction, 'USD');
    if (updated) {
      setCurrentTransaction(updated);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Transaction Card */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{transaction.category}</CardTitle>
              <CardDescription className="mt-2">{transaction.description}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Original Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Original Amount</p>
              <p className="text-2xl font-bold">
                {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount), baseCurrency)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Currency: {baseCurrency}</p>
            </div>

            {/* Converted Amount */}
            {currentTransaction.convertedAmount !== undefined && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Converted to USD</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {isIncome ? '+' : '-'}{formatCurrency(Math.abs(currentTransaction.convertedAmount), 'USD')}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Rate: {currentTransaction.conversionRate?.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default">
              {isIncome ? 'Income' : 'Expense'}
            </Badge>
            {isStale && (
              <Badge variant="outline" className="text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="w-3 h-3 mr-1" />
                Data Stale
              </Badge>
            )}
            {currentTransaction.lastUpdated && (
              <Badge variant="secondary">
                Updated: {new Date(currentTransaction.lastUpdated).toLocaleTimeString()}
              </Badge>
            )}
          </div>

          {/* Transaction Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-medium flex items-center gap-1 mt-1">
                <Calendar className="w-4 h-4" />
                {transaction.date}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="text-sm font-medium flex items-center gap-1 mt-1">
                <Tag className="w-4 h-4" />
                {transaction.type}
              </p>
            </div>
            {transaction.metadata?.vendor && (
              <div>
                <p className="text-xs text-muted-foreground">Vendor</p>
                <p className="text-sm font-medium mt-1">{transaction.metadata.vendor}</p>
              </div>
            )}
            {transaction.metadata?.taxAmount && (
              <div>
                <p className="text-xs text-muted-foreground">Tax</p>
                <p className="text-sm font-medium mt-1">
                  {formatCurrency(transaction.metadata.taxAmount, baseCurrency)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rate Trend */}
      {trendData && trendData.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              7-Day Exchange Rate Trend
            </CardTitle>
            <CardDescription>
              {baseCurrency} to USD over the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <div className="flex items-center justify-center h-80">
                <p className="text-muted-foreground">Loading trend data...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    domain={['dataMin - 0.001', 'dataMax + 0.001']}
                  />
                  <Tooltip
                    formatter={(value: number) => value.toFixed(6)}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Line Items (if available) */}
      {transaction.metadata?.items && transaction.metadata.items.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transaction.metadata.items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    {item.quantity && <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>}
                  </div>
                  <p className="font-semibold text-sm">
                    {formatCurrency(item.price, baseCurrency)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Close Button */}
      {onClose && (
        <Button onClick={onClose} variant="outline" className="w-full">
          Close
        </Button>
      )}
    </div>
  );
}
