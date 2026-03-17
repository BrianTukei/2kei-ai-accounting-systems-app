import React from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';

interface LiveCurrencyAmountProps {
  amount: number;
  fromCurrency?: string;
  className?: string;
  showConversion?: boolean;
}

/**
 * LiveCurrencyAmount - Working Currency Converter
 * 
 * This component properly converts amounts using live exchange rates.
 * When currency changes, it recalculates and displays the converted amount.
 * 
 * Example: amount={10000} fromCurrency="USD" 
 * → Shows USh 37,800,000 when UGX is selected
 * → Shows $10,000.00 when USD is selected
 */
export const LiveCurrencyAmount: React.FC<LiveCurrencyAmountProps> = ({
  amount,
  fromCurrency = 'USD',
  className,
  showConversion = false,
}) => {
  const { selectedCurrency, exchangeRates } = useCurrency();

  // Ensure currencies are uppercase
  const from = fromCurrency.toUpperCase();
  const to = selectedCurrency.code.toUpperCase();

  // Calculate conversion
  let convertedAmount = amount;
  let rate = 1;

  if (from !== to) {
    // Get rate from exchange rates
    if (from === 'USD' && exchangeRates[to]) {
      // Direct USD to target rate
      rate = exchangeRates[to];
      convertedAmount = amount * rate;
    } else if (to === 'USD' && exchangeRates[from]) {
      // Target to USD (inverse)
      rate = 1 / exchangeRates[from];
      convertedAmount = amount * rate;
    } else if (exchangeRates[from] && exchangeRates[to]) {
      // Cross rate calculation
      rate = exchangeRates[to] / exchangeRates[from];
      convertedAmount = amount * rate;
    } else {
      // Fallback rates if API rates not available
      const fallbackRates: Record<string, number> = {
        USD: 1, UGX: 3780, KES: 153, TZS: 2650, RWF: 1280,
        NGN: 1580, GHS: 14.8, ZAR: 18.7, ZMW: 26.5,
        EUR: 0.93, GBP: 0.80, JPY: 149.5
      };
      
      if (from === 'USD' && fallbackRates[to]) {
        rate = fallbackRates[to];
        convertedAmount = amount * rate;
      } else if (fallbackRates[from] && fallbackRates[to]) {
        rate = fallbackRates[to] / fallbackRates[from];
        convertedAmount = amount * rate;
      }
    }
  }

  // Format the converted amount
  const formatAmount = (value: number, currency: string): string => {
    const symbols: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥',
      UGX: 'USh', KES: 'KSh', TZS: 'TSh', RWF: 'RF',
      NGN: '₦', GHS: '₵', ZAR: 'R', ZMW: 'ZK'
    };
    
    const symbol = symbols[currency] || currency;
    
    // Format based on currency (some don't use decimals)
    const useDecimals = !['UGX', 'KES', 'TZS', 'RWF', 'NGN', 'JPY'].includes(currency);
    const decimals = useDecimals ? 2 : 0;
    
    const formatted = value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    
    return `${symbol} ${formatted}`;
  };

  return (
    <span className={cn('inline-flex flex-col', className)}>
      <span className="font-medium">
        {formatAmount(convertedAmount, to)}
      </span>
      
      {showConversion && from !== to && (
        <span className="text-xs text-gray-400">
          {formatAmount(amount, from)} → {formatAmount(convertedAmount, to)}
        </span>
      )}
      
      {from !== to && (
        <span className="text-xs text-gray-400">
          Rate: 1 {from} = {rate.toFixed(2)} {to}
        </span>
      )}
    </span>
  );
};

export default LiveCurrencyAmount;
