import React from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';

interface CurrencyAmountProps {
  amount: number;
  fromCurrency?: string;
  className?: string;
  showOriginal?: boolean;
  decimals?: number;
}

/**
 * CurrencyAmount Component
 * 
 * Displays an amount auto-converted to the user's selected currency.
 * When user changes currency (e.g., USD → UGX), all amounts update automatically.
 * 
 * Example:
 *   <CurrencyAmount amount={10} fromCurrency="USD" />
 *   // Shows: USh 37,727 when currency is UGX
 *   // Shows: $10.00 when currency is USD
 */
export const CurrencyAmount: React.FC<CurrencyAmountProps> = ({
  amount,
  fromCurrency = 'USD',
  className,
  showOriginal = false,
  decimals,
}) => {
  const { formatCurrency, selectedCurrency, convertAmount } = useCurrency();

  const formatted = formatCurrency(amount, fromCurrency);
  
  // Calculate converted amount for display
  const convertedAmount = convertAmount(amount, fromCurrency, selectedCurrency.code);

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="font-medium">{formatted}</span>
      
      {showOriginal && fromCurrency !== selectedCurrency.code && (
        <span className="text-xs text-gray-400">
          ({fromCurrency} {amount.toFixed(2)})
        </span>
      )}
    </span>
  );
};

/**
 * Simple currency display without conversion
 */
export const Money: React.FC<{
  amount: number;
  currency?: string;
  className?: string;
}> = ({ amount, currency, className }) => {
  const { formatCurrency, selectedCurrency } = useCurrency();
  
  const targetCurrency = currency || selectedCurrency.code;
  const formatted = formatCurrency(amount, targetCurrency);

  return (
    <span className={cn('font-medium', className)}>
      {formatted}
    </span>
  );
};

/**
 * Currency change indicator
 * Shows when an amount differs from original currency
 */
export const CurrencyIndicator: React.FC<{
  fromCurrency: string;
  className?: string;
}> = ({ fromCurrency, className }) => {
  const { selectedCurrency, exchangeRates } = useCurrency();

  if (fromCurrency === selectedCurrency.code) return null;

  const rate = exchangeRates[selectedCurrency.code] || 0;

  return (
    <span className={cn('text-xs text-gray-500', className)}>
      1 {fromCurrency} = {rate.toFixed(2)} {selectedCurrency.code}
    </span>
  );
};

export default CurrencyAmount;
