import { useCallback } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface UseMoneyReturn {
  /**
   * Format amount with auto-conversion to selected currency
   * Example: format(10, 'USD') → "USh 37,727" when currency is UGX
   */
  format: (amount: number, fromCurrency?: string) => string;
  
  /**
   * Convert amount to selected currency (returns number)
   * Example: convert(10, 'USD') → 37727.30 when currency is UGX
   */
  convert: (amount: number, fromCurrency?: string) => number;
  
  /**
   * Format with both original and converted amounts
   * Example: formatDual(10, 'USD') → "$10.00 (USh 37,727)"
   */
  formatDual: (amount: number, fromCurrency: string) => string;
  
  /**
   * Get current currency symbol
   */
  symbol: string;
  
  /**
   * Get current currency code
   */
  code: string;
  
  /**
   * Check if amount needs conversion
   */
  needsConversion: (fromCurrency: string) => boolean;
  
  /**
   * Format as compact (K, M, B)
   * Example: formatCompact(1000000) → "$1M"
   */
  formatCompact: (amount: number, fromCurrency?: string) => string;
}

/**
 * useMoney Hook
 * 
 * Easy-to-use hook for currency formatting and conversion throughout the app.
 * All amounts automatically convert when user changes currency.
 * 
 * @example
 * ```tsx
 * function InvoiceItem({ amount }: { amount: number }) {
 *   const { format } = useMoney();
 *   return <span>{format(amount, 'USD')}</span>;
 * }
 * ```
 */
export function useMoney(): UseMoneyReturn {
  const { 
    selectedCurrency, 
    formatCurrency, 
    convertAmount,
    exchangeRates 
  } = useCurrency();

  const format = useCallback((
    amount: number, 
    fromCurrency: string = 'USD'
  ): string => {
    return formatCurrency(amount, fromCurrency);
  }, [formatCurrency]);

  const convert = useCallback((
    amount: number, 
    fromCurrency: string = 'USD'
  ): number => {
    return convertAmount(amount, fromCurrency, selectedCurrency.code);
  }, [convertAmount, selectedCurrency.code]);

  const formatDual = useCallback((
    amount: number, 
    fromCurrency: string
  ): string => {
    if (fromCurrency === selectedCurrency.code) {
      return formatCurrency(amount, fromCurrency);
    }

    const converted = convertAmount(amount, fromCurrency, selectedCurrency.code);
    const original = formatCurrency(amount, fromCurrency);
    const convertedFormatted = formatCurrency(converted, selectedCurrency.code);

    return `${original} (${convertedFormatted})`;
  }, [formatCurrency, convertAmount, selectedCurrency.code]);

  const needsConversion = useCallback((fromCurrency: string): boolean => {
    return fromCurrency !== selectedCurrency.code;
  }, [selectedCurrency.code]);

  const formatCompact = useCallback((
    amount: number,
    fromCurrency: string = 'USD'
  ): string => {
    const converted = convertAmount(amount, fromCurrency, selectedCurrency.code);
    
    let formatted: string;
    if (Math.abs(converted) >= 1e9) {
      formatted = (converted / 1e9).toFixed(1) + 'B';
    } else if (Math.abs(converted) >= 1e6) {
      formatted = (converted / 1e6).toFixed(1) + 'M';
    } else if (Math.abs(converted) >= 1e3) {
      formatted = (converted / 1e3).toFixed(1) + 'K';
    } else {
      formatted = converted.toFixed(0);
    }

    return `${selectedCurrency.symbol}${formatted}`;
  }, [convertAmount, selectedCurrency]);

  return {
    format,
    convert,
    formatDual,
    formatCompact,
    symbol: selectedCurrency.symbol,
    code: selectedCurrency.code,
    needsConversion,
  };
}

/**
 * Standalone currency formatter (no hook needed)
 * Use for formatting outside of React components
 */
export function formatMoney(
  amount: number,
  currencyCode: string,
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

export default useMoney;
