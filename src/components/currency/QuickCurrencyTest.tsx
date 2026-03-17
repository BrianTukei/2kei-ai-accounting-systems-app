import React, { useEffect, useState } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';

/**
 * Simple test to verify currency conversion is working
 */
export const QuickCurrencyTest: React.FC = () => {
  const { selectedCurrency, exchangeRates, ratesSource, formatCurrency, convertAmount } = useCurrency();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const testAmount = 10000;
  const fromCurr = 'USD';
  
  // Direct calculation
  const fromRate = exchangeRates[fromCurr] || 1;
  const toRate = exchangeRates[selectedCurrency.code] || 1;
  const calculated = (testAmount / fromRate) * toRate;

  return (
    <div className="p-4 bg-yellow-100 rounded-lg">
      <h3 className="font-bold mb-2">Currency Conversion Debug</h3>
      <div className="text-sm space-y-1">
        <div>Selected Currency: <strong>{selectedCurrency.code}</strong></div>
        <div>Rates Source: <strong>{ratesSource}</strong></div>
        <div>Rates Count: <strong>{Object.keys(exchangeRates).length}</strong></div>
        <div>USD Rate: {exchangeRates['USD'] || 'N/A'}</div>
        <div>{selectedCurrency.code} Rate: {exchangeRates[selectedCurrency.code] || 'N/A'}</div>
        <hr className="my-2" />
        <div>Test: {testAmount} USD</div>
        <div>Calculated: {calculated.toFixed(2)} {selectedCurrency.code}</div>
        <div>formatCurrency Result: <strong>{formatCurrency(testAmount, 'USD')}</strong></div>
        <div>convertAmount Result: <strong>{convertAmount(testAmount, 'USD', selectedCurrency.code)}</strong></div>
      </div>
    </div>
  );
};

export default QuickCurrencyTest;
