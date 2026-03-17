import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency, CURRENCIES } from '@/contexts/CurrencyContext';
import { exchangeService } from '@/services/exchangeService';
import { Loader2, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Real-time Currency Conversion Demo Page
 * 
 * This page demonstrates live forex conversion.
 * When you change currency, all amounts automatically convert.
 * 
 * Example: $10 USD → USh 37,800 when UGX is selected
 */
export default function CurrencyConversionPage() {
  const { selectedCurrency, setCurrency, formatCurrency, convertAmount } = useCurrency();
  const [amount, setAmount] = useState<number>(10);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [convertedAmount, setConvertedAmount] = useState<number>(10);
  const [currentRate, setCurrentRate] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Recalculate when currency or amount changes
  useEffect(() => {
    const recalculate = async () => {
      setIsLoading(true);
      try {
        // Get live conversion
        const converted = convertAmount(amount, fromCurrency, selectedCurrency.code);
        setConvertedAmount(converted);

        // Get current rate
        const rate = await exchangeService.getRate(fromCurrency, selectedCurrency.code);
        setCurrentRate(rate);

        // Get last updated time
        const updated = exchangeService.getLastUpdated();
        if (updated) {
          setLastUpdated(new Date(updated).toLocaleString());
        }
      } catch (err) {
        console.error('Conversion error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    recalculate();
  }, [amount, fromCurrency, selectedCurrency.code, convertAmount]);

  const handleRefreshRates = async () => {
    setIsLoading(true);
    try {
      await exchangeService.refreshRates();
      toast.success('Exchange rates refreshed!');
      
      // Recalculate
      const converted = convertAmount(amount, fromCurrency, selectedCurrency.code);
      setConvertedAmount(converted);
      
      const rate = await exchangeService.getRate(fromCurrency, selectedCurrency.code);
      setCurrentRate(rate);
      
      const updated = exchangeService.getLastUpdated();
      if (updated) {
        setLastUpdated(new Date(updated).toLocaleString());
      }
    } catch (err) {
      toast.error('Failed to refresh rates');
    } finally {
      setIsLoading(false);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(selectedCurrency.code);
    setCurrency(CURRENCIES.find(c => c.code === fromCurrency) || CURRENCIES[0]);
  };

  // Sample amounts to test
  const sampleAmounts = [10, 50, 100, 500, 1000, 5000, 10000];

  return (
    <PageLayout
      title="Live Currency Conversion"
      subtitle="Real-time forex rates with automatic conversion"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Main Converter Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              Currency Converter
            </CardTitle>
            <CardDescription>
              Amounts convert automatically when you change currency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* From Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount & From</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="flex-1 px-3 py-2 border rounded-md"
                    placeholder="Enter amount"
                  />
                  <Select value={fromCurrency} onValueChange={setFromCurrency}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.filter(c => ['USD', 'EUR', 'GBP', 'UGX', 'KES', 'TZS', 'NGN', 'GHS', 'ZAR'].includes(c.code)).map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} ({c.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex items-end justify-center md:justify-start">
                <Button variant="outline" size="icon" onClick={swapCurrencies} className="mb-0.5">
                  <ArrowRightLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* To Currency (User's Selected Currency) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Convert To (Your Currency)</label>
              <Select 
                value={selectedCurrency.code} 
                onValueChange={(code) => {
                  const currency = CURRENCIES.find(c => c.code === code);
                  if (currency) setCurrency(currency);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">African Currencies</div>
                  {CURRENCIES.filter(c => ['UGX', 'KES', 'TZS', 'RWF', 'NGN', 'GHS', 'ZAR', 'ZMW'].includes(c.code)).map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.code} - {c.name}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">Major Currencies</div>
                  {CURRENCIES.filter(c => ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'].includes(c.code)).map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Result Display */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {amount.toLocaleString()} {fromCurrency} =
              </div>
              <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                {isLoading ? (
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                ) : (
                  formatCurrency(amount, fromCurrency)
                )}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                at rate 1 {fromCurrency} = {currentRate.toFixed(2)} {selectedCurrency.code}
              </div>
              {lastUpdated && (
                <div className="text-xs text-gray-400 mt-1">
                  Rates last updated: {lastUpdated}
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <Button 
              onClick={handleRefreshRates} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Refresh Live Rates
            </Button>
          </CardContent>
        </Card>

        {/* Sample Conversions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Conversions</CardTitle>
            <CardDescription>
              See how different amounts convert from {fromCurrency} to {selectedCurrency.code}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {sampleAmounts.map((sampleAmount) => {
                const converted = convertAmount(sampleAmount, fromCurrency, selectedCurrency.code);
                return (
                  <div 
                    key={sampleAmount}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center"
                  >
                    <div className="text-sm text-gray-500">
                      {fromCurrency} {sampleAmount.toLocaleString()}
                    </div>
                    <div className="font-semibold text-indigo-600">
                      {formatCurrency(sampleAmount, fromCurrency)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">1.</span>
                All amounts in your system are stored in their original currency (e.g., USD)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">2.</span>
                When you select a new currency (e.g., UGX), amounts automatically convert using live forex rates
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">3.</span>
                Example: $10 USD converts to USh 37,800 at current rates
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">4.</span>
                Rates refresh every 10 minutes to stay current
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">5.</span>
                Use the &lt;CurrencyAmount&gt; component anywhere: &lt;CurrencyAmount amount={10} fromCurrency="USD" /&gt;
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

// Utility for class merging
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
