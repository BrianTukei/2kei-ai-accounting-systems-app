/**
 * Real-Time Forex Rates Component
 * Displays live exchange rates with trends and multi-currency support
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, RefreshCw, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCurrency } from '@/contexts/CurrencyContext';

interface ForexRate {
  from: string;
  to: string;
  rate: number;
  change?: number;
  trend?: number[];
  lastUpdated?: string;
}

interface ForexStats {
  majorPairs: Record<string, any>;
  africaCurrencies: Record<string, any>;
  timestamp: string;
}

export default function RealTimeForexRates() {
  const { currency: baseCurrency } = useCurrency();
  const [forexStats, setForexStats] = useState<ForexStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch forex rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/forex/stats');
        if (response.ok) {
          const data = await response.json();
          setForexStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch forex rates', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();

    // Auto-refresh every 60 seconds if enabled
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(fetchRates, 60000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const RateCard = ({ pair, data }: { pair: string; data: any }) => {
    const isPositive = data.change >= 0;

    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-sm">{pair}</span>
          <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs">
            {isPositive ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
            {Math.abs(data.change).toFixed(2)}%
          </Badge>
        </div>

        <div className="text-2xl font-bold mb-2">{data.rate.toFixed(4)}</div>

        {data.trend && data.trend.length > 0 && (
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={data.trend.map((r, i) => ({ value: r, index: i }))}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Exchange Rates</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time forex rates for transactions and currency conversion
          </p>
        </div>
        <button
          onClick={async () => {
            try {
              setLoading(true);
              const response = await fetch('/api/forex/stats');
              if (response.ok) {
                const data = await response.json();
                setForexStats(data);
              }
            } catch (error) {
              console.error('Failed to refresh rates', error);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Major Currency Pairs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Major Currency Pairs
          </CardTitle>
          <CardDescription>
            Global market rates updated every minute
          </CardDescription>
        </CardHeader>
        <CardContent>
          {forexStats?.majorPairs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(forexStats.majorPairs).map(([pair, data]: [string, any]) => (
                <RateCard key={pair} pair={pair} data={data} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {loading ? 'Loading rates...' : 'No forex data available'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* African Currency Pairs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5" />
            African Currencies
          </CardTitle>
          <CardDescription>
            Localized rates for East African markets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {forexStats?.africaCurrencies ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(forexStats.africaCurrencies).map(([pair, data]: [string, any]) => (
                <RateCard key={pair} pair={pair} data={data} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {loading ? 'Loading rates...' : 'No forex data available'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Updated */}
      {forexStats?.timestamp && (
        <div className="text-center text-xs text-muted-foreground">
          Last updated: {new Date(forexStats.timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

// Helper icon component
function ThumbsUp(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
    </svg>
  );
}
