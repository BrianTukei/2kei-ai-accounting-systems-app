import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencySelector } from './CurrencySelector';
import { CurrencyAmount } from './CurrencyAmount';
import { useMoney } from '@/hooks/useMoney';

/**
 * CurrencyConversionDemo
 * 
 * Demonstrates real-time currency conversion.
 * Shows how $10 USD converts to UGX 37,727 (or other currencies)
 * when user changes the selected currency.
 */
export const CurrencyConversionDemo: React.FC = () => {
  const { format, convert, code, symbol } = useMoney();

  // Example amounts in different currencies
  const examples = [
    { amount: 10, currency: 'USD', label: 'Small amount' },
    { amount: 100, currency: 'USD', label: 'Medium amount' },
    { amount: 1000, currency: 'USD', label: 'Large amount' },
    { amount: 50000, currency: 'UGX', label: 'UGX amount' },
    { amount: 5000, currency: 'KES', label: 'KES amount' },
  ];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Real-Time Currency Conversion</CardTitle>
        <CurrencySelector />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-sm text-gray-500">
          Current currency: <strong>{code}</strong> ({symbol})
        </div>

        <div className="space-y-3">
          {examples.map((example, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <div className="font-medium">{example.label}</div>
                <div className="text-sm text-gray-500">
                  Original: {example.currency} {example.amount.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  <CurrencyAmount 
                    amount={example.amount} 
                    fromCurrency={example.currency}
                  />
                </div>
                <div className="text-xs text-gray-400">
                  Converted from {example.currency}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">How it works:</h4>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>All amounts automatically convert when you change currency</li>
            <li>Rates updated every 10 minutes from live exchange data</li>
            <li>Example: $10 USD = USh 37,727 (at current rates)</li>
            <li>Use &lt;CurrencyAmount&gt; component or useMoney() hook</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrencyConversionDemo;
