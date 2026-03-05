import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { exchangeService } from '@/services/exchangeService';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Unified currency formatting utility.
 * Reads user's selected currency from localStorage when no target code given.
 * If `fromCurrency` is provided, auto-converts the amount before formatting.
 */
export function formatCurrency(
  amount: number,
  currencyCode?: string,
  locale?: string,
  fromCurrency?: string,
): string {
  if (!currencyCode) {
    try {
      const stored = localStorage.getItem('selected-currency');
      if (stored) {
        const parsed = JSON.parse(stored);
        currencyCode = parsed.code || 'USD';
        locale = locale || parsed.locale || 'en-US';
      }
    } catch { /* ignore */ }
  }
  currencyCode = currencyCode || 'USD';
  locale = locale || 'en-US';

  // Auto-convert if amount is in a different currency
  let displayAmount = amount;
  if (fromCurrency && fromCurrency.toUpperCase() !== currencyCode.toUpperCase()) {
    displayAmount = exchangeService.convertSync(amount, fromCurrency, currencyCode);
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(displayAmount);
  } catch (error) {
    // Fallback formatting
    const symbols: { [key: string]: string } = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$',
      CHF: '₣', CNY: '¥', INR: '₹', BRL: 'R$', ZAR: 'R', KRW: '₩',
      SGD: 'S$', HKD: 'HK$', SEK: 'kr', NOK: 'kr', DKK: 'kr',
      PLN: 'zł', CZK: 'Kč', HUF: 'Ft', RUB: '₽', TRY: '₺',
      MXN: '$', ARS: '$', CLP: '$', COP: '$', PEN: 'S/', UYU: '$',
      EGP: '£', MAD: 'DH', NGN: '₦', GHS: '₵', KES: 'KSh',
      UGX: 'USh', TZS: 'TSh', ZMW: 'ZK', BWP: 'P', AED: 'د.إ',
      SAR: '﷼', QAR: '﷼', KWD: 'د.ك', BHD: '.د.ب', OMR: '﷼',
      JOD: 'د.ا', LBP: '£', THB: '฿', VND: '₫', IDR: 'Rp',
      MYR: 'RM', PHP: '₱', PKR: '₨', BDT: '৳', LKR: '₨', NPR: '₨'
    };
    const symbol = symbols[currencyCode] || currencyCode || '$';
    return `${symbol}${displayAmount.toFixed(2)}`;
  }
}

/**
 * Convert amount between currencies using live cached rates.
 * Synchronous — uses client-cached rates.
 */
export function convertCurrency(amount: number, from: string, to: string): number {
  return exchangeService.convertSync(amount, from, to);
}

/**
 * Get the exchange rate between two currencies synchronously.
 */
export function getExchangeRate(from: string, to: string): number {
  return exchangeService.getRateSync(from, to);
}
