import React from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';

interface CurrencyAmountProps {
  amount: number;
  fromCurrency?: string;
  className?: string;
  showOriginal?: boolean;
}

/**
 * CurrencyAmount Component - FIXED VERSION
 * 
 * Properly converts and displays amounts in the selected currency.
 * 
 * Example: <CurrencyAmount amount={10000} fromCurrency="USD" />
 * Shows: USh 37,800,000 when UGX selected
 * Shows: $10,000.00 when USD selected
 */
export const CurrencyAmount: React.FC<CurrencyAmountProps> = ({
  amount,
  fromCurrency = 'USD',
  className,
  showOriginal = false,
}) => {
  const { selectedCurrency, exchangeRates } = useCurrency();

  const from = fromCurrency.toUpperCase();
  const to = selectedCurrency.code.toUpperCase();

  // Get rates (USD-based)
  const fromRate = exchangeRates[from] || (from === 'USD' ? 1 : 0);
  const toRate = exchangeRates[to] || (to === 'USD' ? 1 : 0);

  // Calculate conversion via USD base
  let convertedAmount = amount;
  
  if (from !== to) {
    if (fromRate && toRate) {
      const amountInUSD = from === 'USD' ? amount : amount / fromRate;
      convertedAmount = to === 'USD' ? amountInUSD : amountInUSD * toRate;
    }
  }

  // Currency symbols
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', 
    UGX: 'USh', KES: 'KSh', TZS: 'TSh', RWF: 'RF',
    NGN: '₦', GHS: '₵', ZAR: 'R', ZMW: 'ZK',
    JPY: '¥', CNY: '¥', INR: '₹', CAD: 'C$', AUD: 'A$'
  };

  const symbol = symbols[to] || to;
  
  // Zero-decimal currencies (African currencies typically don't use decimals)
  const zeroDecimalCurrencies = ['UGX', 'KES', 'TZS', 'RWF', 'NGN', 'JPY', 'VND', 'IDR'];
  const decimals = zeroDecimalCurrencies.includes(to) ? 0 : 2;

  const formatted = convertedAmount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="font-medium">{symbol}{formatted}</span>
      {showOriginal && from !== to && (
        <span className="text-xs text-gray-400">
          ({from} {amount.toLocaleString()})
        </span>
      )}
    </span>
  );
};

/**
 * Money - Simple display in selected currency
 */
export const Money: React.FC<{
  amount: number;
  currency?: string;
  className?: string;
}> = ({ amount, currency, className }) => {
  return (
    <CurrencyAmount 
      amount={amount} 
      fromCurrency={currency || 'USD'} 
      className={className}
    />
  );
};

/**
 * CurrencyIndicator - Shows exchange rate
 */
export const CurrencyIndicator: React.FC<{
  fromCurrency: string;
  className?: string;
}> = ({ fromCurrency, className }) => {
  const { selectedCurrency, exchangeRates } = useCurrency();

  if (fromCurrency === selectedCurrency.code) return null;

  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate = exchangeRates[selectedCurrency.code] || 1;
  const rate = fromRate && toRate ? toRate / fromRate : 0;

  return (
    <span className={cn('text-xs text-gray-500', className)}>
      1 {fromCurrency} = {rate.toFixed(2)} {selectedCurrency.code}
    </span>
  );
};

export default CurrencyAmount;
