import React, { useState } from 'react';

// Hardcoded rates for testing - these work
const TEST_RATES: Record<string, number> = {
  USD: 1, EUR: 0.93, GBP: 0.80,
  UGX: 3780, KES: 153, TZS: 2650, RWF: 1280,
  NGN: 1580, GHS: 14.8, ZAR: 18.7, ZMW: 26.5
};

const SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£',
  UGX: 'USh', KES: 'KSh', TZS: 'TSh', RWF: 'RF',
  NGN: '₦', GHS: '₵', ZAR: 'R', ZMW: 'ZK'
};

/**
 * Simple working currency converter with hardcoded rates
 * This proves the logic works - then we can fix the API
 */
export const SimpleCurrencyConverter: React.FC = () => {
  const [amount, setAmount] = useState(10000);
  const [fromCurr, setFromCurr] = useState('USD');
  const [toCurr, setToCurr] = useState('UGX');

  // Simple conversion
  const fromRate = TEST_RATES[fromCurr] || 1;
  const toRate = TEST_RATES[toCurr] || 1;
  const converted = (amount / fromRate) * toRate;

  const fromSymbol = SYMBOLS[fromCurr] || fromCurr;
  const toSymbol = SYMBOLS[toCurr] || toCurr;

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Simple Currency Converter (TEST)</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <select
              value={fromCurr}
              onChange={(e) => setFromCurr(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              {Object.keys(TEST_RATES).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <select
              value={toCurr}
              onChange={(e) => setToCurr(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              {Object.keys(TEST_RATES).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded text-center">
          <div className="text-sm text-gray-600">
            {fromSymbol}{amount.toLocaleString()} {fromCurr}
          </div>
          <div className="text-2xl font-bold text-green-600">
            = {toSymbol}{Math.round(converted).toLocaleString()} {toCurr}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Rate: 1 {fromCurr} = {(toRate / fromRate).toFixed(2)} {toCurr}
          </div>
        </div>

        <div className="text-xs text-gray-400">
          Using hardcoded rates for testing. <br/>
          USD→UGX rate: {TEST_RATES.UGX} (so $10,000 = USh 37,800,000)
        </div>
      </div>
    </div>
  );
};

export default SimpleCurrencyConverter;
